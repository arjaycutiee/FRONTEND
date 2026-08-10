import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDrawer } from '@/app/(tabs)/_layout';
import { localDb } from '@/app/services/localDb';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Academics', 'Others'];
const INCOME_CATEGORIES = ['Allowance', 'Job', 'Scholarship', 'Others'];

export default function WalletScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Theme Color Palette
  const primaryBrown = '#A97C50';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#9BA1A6' : '#666666';
  const cardBg = isDark ? '#1E1E1E' : '#F8FAFC';
  const borderCol = isDark ? '#2E2E2E' : '#E2E8F0';
  const inputBg = isDark ? '#121212' : '#FFFFFF';
  const bgTheme = isDark ? '#121212' : '#FFFFFF';

  // Success Green and Error Red colors
  const successGreen = '#10B981';
  const errorRed = '#EF4444';

  // State
  // State synced with central database
  const [transactions, setTransactionsState] = useState<Transaction[]>(() => localDb.getTransactions());

  const setTransactions = (newTransactions: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
    const updated = typeof newTransactions === 'function' ? newTransactions(localDb.getTransactions()) : newTransactions;
    localDb.setTransactions(updated);
    setTransactionsState(updated);
  };

  useEffect(() => {
    const unsubscribe = localDb.subscribe(() => {
      setTransactionsState(localDb.getTransactions());
    });
    return unsubscribe;
  }, []);

  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState('Food');
  const [isAdding, setIsAdding] = useState(false);

  // Computations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const handleAddTransaction = () => {
    if (!newTitle.trim() || !newAmount) return;

    const transactionItem: Transaction = {
      id: Date.now().toString(),
      title: newTitle,
      amount: parseFloat(newAmount) || 0,
      category: newCategory,
      date: 'Today',
      type: transactionType,
    };

    setTransactions([transactionItem, ...transactions]);
    setNewTitle('');
    setNewAmount('');
    setIsAdding(false);
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setNewCategory(type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    
    // Choose icon based on transaction type and category
    let iconName: any = 'dollar-sign';
    if (isIncome) {
      if (item.category === 'Allowance') iconName = 'gift';
      else if (item.category === 'Job') iconName = 'briefcase';
      else if (item.category === 'Scholarship') iconName = 'award';
      else iconName = 'arrow-down-left';
    } else {
      if (item.category === 'Food') iconName = 'coffee';
      else if (item.category === 'Transport') iconName = 'truck';
      else if (item.category === 'Academics') iconName = 'book-open';
      else iconName = 'arrow-up-right';
    }

    return (
      <View style={[styles.transactionItem, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <View
          style={[
            styles.itemIconContainer,
            { backgroundColor: isIncome ? successGreen + '15' : primaryBrown + '15' },
          ]}
        >
          <Feather
            name={iconName}
            size={20}
            color={isIncome ? successGreen : primaryBrown}
          />
        </View>
        <View style={styles.itemDetails}>
          <Text style={[styles.itemTitle, { color: textPrimary }]}>{item.title}</Text>
          <Text style={[styles.itemSubtitle, { color: textSecondary }]}>
            {item.category} • {item.date}
          </Text>
        </View>
        <Text
          style={[
            styles.itemAmount,
            { color: isIncome ? successGreen : textPrimary },
          ]}
        >
          {isIncome ? '+' : '-'} ₱{item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  const { openDrawer } = useDrawer();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgTheme }]} edges={['top']}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openDrawer} style={{ marginRight: 10, padding: 4 }}>
            <Feather name="menu" size={24} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Wallet</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: primaryBrown }]}
          onPress={() => {
            setNewTitle('');
            setNewAmount('');
            setTransactionType('expense');
            setNewCategory('Food');
            setIsAdding(true);
          }}
        >
          <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Dashboard Cards Section */}
      <View style={[styles.dashboardCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
        <Text style={[styles.dashboardLabel, { color: textSecondary }]}>Wallet Balance</Text>
        <Text style={[styles.dashboardValue, { color: netBalance >= 0 ? successGreen : errorRed }]}>
          ₱{netBalance.toFixed(2)}
        </Text>
        
        <View style={[styles.dashboardDivider, { backgroundColor: borderCol }]} />
        
        <View style={styles.dashboardStats}>
          <View style={styles.statColumn}>
            <View style={styles.statHeaderRow}>
              <Feather name="arrow-down-left" size={14} color={successGreen} style={{ marginRight: 4 }} />
              <Text style={[styles.statLabelText, { color: textSecondary }]}>Income</Text>
            </View>
            <Text style={[styles.statValueText, { color: successGreen }]}>₱{totalIncome.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.verticalDivider, { backgroundColor: borderCol }]} />
          
          <View style={styles.statColumn}>
            <View style={styles.statHeaderRow}>
              <Feather name="arrow-up-right" size={14} color={errorRed} style={{ marginRight: 4 }} />
              <Text style={[styles.statLabelText, { color: textSecondary }]}>Expenses</Text>
            </View>
            <Text style={[styles.statValueText, { color: errorRed }]}>₱{totalExpenses.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <Text style={[styles.sectionTitle, { color: textSecondary }]}>Recent Transactions</Text>
      
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textSecondary }]}>No transactions tracked yet.</Text>
          </View>
        }
      />

      {/* Transaction Add Modal */}
      <Modal
        visible={isAdding}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAdding(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: borderCol }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textPrimary }]}>Add New Transaction</Text>
                <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.closeButton}>
                  <Feather name="x" size={22} color={textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Transaction Type Toggles */}
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      {
                        backgroundColor: transactionType === 'expense' ? errorRed : inputBg,
                        borderColor: transactionType === 'expense' ? errorRed : borderCol,
                      },
                    ]}
                    onPress={() => handleTypeChange('expense')}
                  >
                    <Feather
                      name="arrow-up-right"
                      size={16}
                      color={transactionType === 'expense' ? '#FFFFFF' : textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.toggleButtonText,
                        { color: transactionType === 'expense' ? '#FFFFFF' : textPrimary },
                      ]}
                    >
                      Expense
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleButton,
                      {
                        backgroundColor: transactionType === 'income' ? successGreen : inputBg,
                        borderColor: transactionType === 'income' ? successGreen : borderCol,
                      },
                    ]}
                    onPress={() => handleTypeChange('income')}
                  >
                    <Feather
                      name="arrow-down-left"
                      size={16}
                      color={transactionType === 'income' ? '#FFFFFF' : textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.toggleButtonText,
                        { color: transactionType === 'income' ? '#FFFFFF' : textPrimary },
                      ]}
                    >
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Text Inputs */}
                <Text style={[styles.inputLabel, { color: textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.input, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                  placeholder="e.g. Weekly Allowance, Lunch"
                  placeholderTextColor={textSecondary}
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus={true}
                />

                <Text style={[styles.inputLabel, { color: textSecondary }]}>Amount (₱)</Text>
                <TextInput
                  style={[styles.input, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                  placeholder="0.00"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                  value={newAmount}
                  onChangeText={setNewAmount}
                />

                {/* Dynamic Category List */}
                <Text style={[styles.categoryLabel, { color: textSecondary }]}>Category</Text>
                <View style={styles.categoryRow}>
                  {(transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: newCategory === cat ? primaryBrown : inputBg,
                          borderColor: borderCol,
                        },
                      ]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          { color: newCategory === cat ? '#FFFFFF' : textPrimary },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: primaryBrown }]}
                  onPress={handleAddTransaction}
                >
                  <Text style={styles.submitButtonText}>
                    Save {transactionType === 'income' ? 'Income' : 'Expense'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dashboardCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  dashboardLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
    alignSelf: 'center',
  },
  dashboardValue: {
    fontSize: 34,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 16,
  },
  dashboardDivider: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  dashboardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValueText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  verticalDivider: {
    width: 1,
    height: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryButton: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
