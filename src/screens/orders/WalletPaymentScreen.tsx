import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
} from 'react-native';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService, WalletBank } from '../../utils/walletService';
import { transactionService, Transaction } from '../../utils/transactionService';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';

const CALLBACK_URL = 'https://grovine.ng/payment/callback';

const formatMoney = (amount: number | string, currency = 'NGN') => {
    const numeric = Number(amount || 0);
    const safe = Number.isNaN(numeric) ? 0 : numeric;
    return `${currency} ${safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const makeIdempotencyKey = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const extractReferenceFromUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        return parsed.searchParams.get('reference') || parsed.searchParams.get('trxref');
    } catch {
        return null;
    }
};

type VerifyStatus = 'verifying' | 'success' | 'failed';

export const WalletPaymentScreen = ({ navigation }: any) => {
    const queryClient = useQueryClient();

    const [topupModalVisible, setTopupModalVisible] = useState(false);
    const [topupAmount, setTopupAmount] = useState('');

    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [pendingReference, setPendingReference] = useState<string | null>(null);

    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('verifying');
    const [verifyMessage, setVerifyMessage] = useState('Verifying payment...');

    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [showBankList, setShowBankList] = useState(false);
    const [bankSearchQuery, setBankSearchQuery] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState<WalletBank | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [reason, setReason] = useState('');

    const [isRefreshingManually, setIsRefreshingManually] = useState(false);

    const {
        data: walletResponse,
        isLoading: isWalletLoading,
        isFetching: isWalletFetching,
        refetch: refetchWalletBalance,
    } = useQuery({
        queryKey: ['wallet-balance'],
        queryFn: walletService.fetchWallet,
    });

    const {
        data: transactionsResponse,
        isLoading: isTransactionsLoading,
        isFetching: isTransactionsFetching,
        refetch: refetchRecentTransactions,
    } = useQuery({
        queryKey: ['wallet-transactions', 5],
        queryFn: () => transactionService.listTransactions({ limit: 5 }),
    });

    const { data: banksResponse, isLoading: isBanksLoading } = useQuery({
        queryKey: ['wallet-banks-ng'],
        queryFn: walletService.listNigerianBanks,
        enabled: withdrawModalVisible,
    });

    const initializeDepositMutation = useMutation({
        mutationFn: ({ amount, idempotencyKey }: { amount: number; idempotencyKey: string }) =>
            walletService.topupWallet(amount, idempotencyKey),
    });

    const verifyDepositMutation = useMutation({
        mutationFn: (reference: string) => walletService.verifyDeposit(reference),
    });

    const verifyAccountMutation = useMutation({
        mutationFn: ({ bankCode, acctNo }: { bankCode: string; acctNo: string }) =>
            walletService.verifyBankAccount(bankCode, acctNo),
    });

    const withdrawMutation = useMutation({
        mutationFn: ({
            amount,
            bankCode,
            acctNo,
            acctName,
            withdrawalReason,
            idempotencyKey,
        }: {
            amount: number;
            bankCode: string;
            acctNo: string;
            acctName: string;
            withdrawalReason: string;
            idempotencyKey: string;
        }) =>
            walletService.withdraw(amount, {
                bank_code: bankCode,
                account_number: acctNo,
                account_name: acctName,
                reason: withdrawalReason,
                idempotency_key: idempotencyKey,
            }),
    });

    const wallet = walletResponse?.data;
    const balance = wallet?.balance || 0;
    const currency = wallet?.currency || 'NGN';
    const transactions = transactionsResponse?.data?.data || [];
    const banks = banksResponse?.data || [];

    const filteredBanks = useMemo(() => {
        const query = bankSearchQuery.trim().toLowerCase();
        if (!query) return banks;
        return banks.filter(
            (bank) =>
                bank.name?.toLowerCase().includes(query) ||
                bank.code?.toLowerCase().includes(query)
        );
    }, [banks, bankSearchQuery]);

    const refreshWalletData = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] }),
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] }),
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions', 5] }),
            queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        ]);
    };

    const handleRefresh = async () => {
        setIsRefreshingManually(true);
        try {
            await Promise.all([
                refetchWalletBalance(),
                refetchRecentTransactions(),
                queryClient.invalidateQueries({ queryKey: ['transactions'] }),
            ]);
        } finally {
            setIsRefreshingManually(false);
        }
    };

    const beginVerify = async (reference: string) => {
        setVerifyStatus('verifying');
        setVerifyMessage('Verifying payment...');
        setVerifyModalVisible(true);

        try {
            const response = await verifyDepositMutation.mutateAsync(reference);
            const status = response?.data?.transaction?.status;
            if (status === 'SUCCESS') {
                setVerifyStatus('success');
                setVerifyMessage(
                    `Wallet funded successfully. New balance: ${formatMoney(response?.data?.wallet_balance || balance, currency)}`
                );
            } else {
                setVerifyStatus('failed');
                setVerifyMessage(`Payment verification returned status: ${status || 'UNKNOWN'}`);
            }
            await refreshWalletData();
        } catch (error: any) {
            setVerifyStatus('failed');
            setVerifyMessage(error?.response?.data?.message || error?.message || 'Failed to verify wallet deposit.');
        } finally {
            setPendingReference(null);
        }
    };

    const handleTopup = async () => {
        const amount = Number(topupAmount);
        if (!amount || amount <= 0) {
            Toast.show({ type: 'error', text1: 'Enter a valid amount' });
            return;
        }

        try {
            const response = await initializeDepositMutation.mutateAsync({
                amount,
                idempotencyKey: makeIdempotencyKey('wallet-deposit'),
            });

            const authorizationUrl = response?.data?.authorization_url;
            const reference = response?.data?.transaction?.reference || null;
            if (!authorizationUrl) {
                Toast.show({
                    type: 'error',
                    text1: 'Initialization failed',
                    text2: 'No authorization URL returned.',
                });
                return;
            }

            setTopupModalVisible(false);
            setTopupAmount('');
            setPendingReference(reference);
            setCheckoutUrl(authorizationUrl);
            setCheckoutModalVisible(true);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Top up failed',
                text2: error?.response?.data?.message || error?.message || 'Could not initialize deposit',
            });
        }
    };

    const handleWebNavigation = (request: { url: string }) => {
        const url = request?.url || '';
        if (url.startsWith(CALLBACK_URL) || url.includes('grovine.ng/payment/callback')) {
            const ref = extractReferenceFromUrl(url) || pendingReference;
            setCheckoutModalVisible(false);
            if (ref) {
                beginVerify(ref);
            } else {
                setVerifyStatus('failed');
                setVerifyMessage('Payment completed but transaction reference was not found.');
                setVerifyModalVisible(true);
            }
            return false;
        }
        return true;
    };

    const handleSelectBank = (bank: WalletBank) => {
        setSelectedBank(bank);
        setAccountName('');
        setShowBankList(false);
        setBankSearchQuery('');
    };

    const handleVerifyAccount = async () => {
        if (!selectedBank) {
            Toast.show({ type: 'error', text1: 'Select a bank first' });
            return;
        }
        if (accountNumber.length < 10) {
            Toast.show({ type: 'error', text1: 'Enter a valid account number' });
            return;
        }

        try {
            const response = await verifyAccountMutation.mutateAsync({
                bankCode: selectedBank.code,
                acctNo: accountNumber,
            });
            const resolvedName = response?.data?.account_name || '';
            setAccountName(resolvedName);
            Toast.show({ type: 'success', text1: 'Account verified' });
        } catch (error: any) {
            setAccountName('');
            Toast.show({
                type: 'error',
                text1: 'Account verification failed',
                text2: error?.response?.data?.message || error?.message || 'Could not verify account',
            });
        }
    };

    const handleWithdraw = async () => {
        const amount = Number(withdrawAmount);
        if (!amount || amount <= 0) {
            Toast.show({ type: 'error', text1: 'Enter a valid withdrawal amount' });
            return;
        }
        if (!selectedBank) {
            Toast.show({ type: 'error', text1: 'Select a bank' });
            return;
        }
        if (accountNumber.length < 10) {
            Toast.show({ type: 'error', text1: 'Enter a valid account number' });
            return;
        }
        if (!accountName) {
            Toast.show({ type: 'error', text1: 'Verify account before withdrawing' });
            return;
        }

        try {
            const response = await withdrawMutation.mutateAsync({
                amount,
                bankCode: selectedBank.code,
                acctNo: accountNumber,
                acctName: accountName,
                withdrawalReason: reason || 'Wallet withdrawal',
                idempotencyKey: makeIdempotencyKey('wallet-withdrawal'),
            });

            const txStatus = response?.data?.transaction?.status || 'UNKNOWN';
            const gatewayMessage =
                response?.data?.transaction?.gateway_response?.message || response?.message || 'Withdrawal processed.';

            if (txStatus === 'SUCCESS') {
                Toast.show({ type: 'success', text1: 'Withdrawal successful', text2: gatewayMessage });
            } else {
                Toast.show({
                    type: txStatus === 'FAILED' ? 'error' : 'info',
                    text1: `Withdrawal ${txStatus.toLowerCase()}`,
                    text2: gatewayMessage,
                });
            }

            await refreshWalletData();
            setWithdrawModalVisible(false);
            setShowBankList(false);
            setBankSearchQuery('');
            setWithdrawAmount('');
            setSelectedBank(null);
            setAccountNumber('');
            setAccountName('');
            setReason('');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Withdrawal failed',
                text2: error?.response?.data?.message || error?.message || 'Could not process withdrawal',
            });
        }
    };

    const renderTransactionItem = (item: Transaction) => {
        const isCredit = item.direction === 'CREDIT';
        return (
            <View key={item.id} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <View className="flex-1 pr-3">
                    <Text className="text-[#424242] font-satoshi font-bold text-[13px]" numberOfLines={1}>
                        {item.description || item.type}
                    </Text>
                    <Text className="text-[#9E9E9E] font-satoshi text-[11px]" numberOfLines={1}>
                        {new Date(item.created_at).toLocaleString()}
                    </Text>
                </View>
                <View className="w-28 items-end">
                    <Text
                        className={`font-satoshi font-bold text-[12px] ${isCredit ? 'text-[#4CAF50]' : 'text-[#F44336]'}`}
                        numberOfLines={1}
                    >
                        {isCredit ? '+' : '-'}{formatMoney(item.amount, currency)}
                    </Text>
                </View>
            </View>
        );
    };

    const canVerifyAccount = !!selectedBank && accountNumber.length >= 10;
    const isLoading = isWalletLoading;
    const isRefreshing = isRefreshingManually || isWalletFetching || isTransactionsFetching;

    if (isLoading) {
        return (
            <ScreenWrapper bg="#F7F7F7">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper bg="#F7F7F7">
            <View className="flex-1">
                <View className="px-6 pt-10 pb-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#424242" />
                    </TouchableOpacity>
                    <Text className="text-[18px] font-satoshi font-bold text-[#424242]">Wallet</Text>
                    <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
                        {isRefreshing ? (
                            <ActivityIndicator color="#4CAF50" size="small" />
                        ) : (
                            <Ionicons name="refresh" size={20} color="#424242" />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1 px-6"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor="#4CAF50"
                        />
                    }
                >
                    <View className="bg-[#4CAF50] rounded-[24px] p-6 mb-6">
                        <Text className="text-white/80 font-satoshi font-bold text-[12px] mb-2">Wallet Balance</Text>
                        <Text className="text-white font-satoshi font-black text-[32px] mb-5">{formatMoney(balance, currency)}</Text>

                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => setTopupModalVisible(true)}
                                className="flex-1 bg-white h-11 rounded-xl items-center justify-center mr-2"
                            >
                                <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">Top Up</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setWithdrawModalVisible(true)}
                                className="flex-1 bg-white/20 border border-white/40 h-11 rounded-xl items-center justify-center ml-2"
                            >
                                <Text className="text-white font-satoshi font-bold text-[12px]">Withdraw</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-[#424242] font-satoshi font-bold text-[15px]">Recent Transactions</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('TransactionHistory')}>
                            <Text className="text-[#4CAF50] font-satoshi font-bold text-[12px]">View all</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-8">
                        {isTransactionsLoading ? (
                            <ActivityIndicator color="#4CAF50" />
                        ) : transactions.length === 0 ? (
                            <Text className="text-[#9E9E9E] font-satoshi text-[12px]">No wallet transactions yet.</Text>
                        ) : (
                            transactions.slice(0, 5).map(renderTransactionItem)
                        )}
                    </View>
                </ScrollView>
            </View>

            <Modal visible={topupModalVisible} transparent animationType="slide" onRequestClose={() => setTopupModalVisible(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/40 justify-end"
                >
                    <View className="bg-white rounded-t-3xl p-6">
                        <Text className="text-[#424242] font-satoshi font-bold text-[17px] mb-4">Top Up Wallet</Text>
                        <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 justify-center mb-4">
                            <TextInput
                                value={topupAmount}
                                onChangeText={setTopupAmount}
                                keyboardType="numeric"
                                placeholder="Enter amount"
                                className="font-satoshi text-[14px] text-[#424242]"
                            />
                        </View>
                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => setTopupModalVisible(false)}
                                className="flex-1 h-12 rounded-xl items-center justify-center bg-gray-100 mr-2"
                            >
                                <Text className="font-satoshi font-bold text-[13px] text-[#424242]">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleTopup}
                                disabled={initializeDepositMutation.isPending}
                                className={`flex-1 h-12 rounded-xl items-center justify-center ml-2 ${initializeDepositMutation.isPending ? 'bg-[#A5D6A7]' : 'bg-[#4CAF50]'}`}
                            >
                                {initializeDepositMutation.isPending ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="font-satoshi font-bold text-[13px] text-white">Proceed</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={checkoutModalVisible} animationType="slide" onRequestClose={() => setCheckoutModalVisible(false)}>
                <View className="flex-1 bg-white">
                    <View className="px-4 pt-20 pb-3 flex-row items-center justify-between border-b border-gray-100">
                        <TouchableOpacity onPress={() => setCheckoutModalVisible(false)}>
                            <Ionicons name="close" size={22} color="#424242" />
                        </TouchableOpacity>
                        <Text className="font-satoshi font-bold text-[16px] text-[#424242]">Complete Payment</Text>
                        <TouchableOpacity
                            onPress={() => {
                                if (pendingReference) {
                                    setCheckoutModalVisible(false);
                                    beginVerify(pendingReference);
                                }
                            }}
                        >
                            <Text className="font-satoshi font-bold text-[12px] text-[#4CAF50]">I paid</Text>
                        </TouchableOpacity>
                    </View>
                    {checkoutUrl ? (
                        <WebView
                            source={{ uri: checkoutUrl }}
                            onShouldStartLoadWithRequest={handleWebNavigation}
                            startInLoadingState
                        />
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator color="#4CAF50" />
                        </View>
                    )}
                </View>
            </Modal>

            <Modal
                visible={withdrawModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setWithdrawModalVisible(false);
                    setShowBankList(false);
                }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 bg-black/40 justify-end"
                >
                    <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text className="text-[#424242] font-satoshi font-bold text-[17px] mb-4">Withdraw to Bank</Text>

                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] mb-1">Amount</Text>
                            <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 justify-center mb-3">
                                <TextInput
                                    value={withdrawAmount}
                                    onChangeText={setWithdrawAmount}
                                    keyboardType="numeric"
                                    placeholder="Enter amount"
                                    className="font-satoshi text-[14px] text-[#424242]"
                                />
                            </View>

                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] mb-1">Bank</Text>
                            <TouchableOpacity
                                onPress={() => setShowBankList((prev) => !prev)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 items-center justify-between flex-row mb-3"
                            >
                                <Text className={`font-satoshi text-[13px] ${selectedBank ? 'text-[#424242]' : 'text-[#BDBDBD]'}`}>
                                    {selectedBank ? `${selectedBank.name} (${selectedBank.code})` : 'Select bank'}
                                </Text>
                                <Ionicons name="chevron-down" size={18} color="#9E9E9E" />
                            </TouchableOpacity>

                            {showBankList ? (
                                <View className="bg-white border border-gray-200 rounded-xl mb-3 max-h-56">
                                    <View className="px-3 py-2 border-b border-gray-100">
                                        <TextInput
                                            value={bankSearchQuery}
                                            onChangeText={setBankSearchQuery}
                                            placeholder="Search bank name or code"
                                            className="h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 font-satoshi text-[13px] text-[#424242]"
                                        />
                                    </View>
                                    {isBanksLoading ? (
                                        <View className="py-4">
                                            <ActivityIndicator color="#4CAF50" />
                                        </View>
                                    ) : filteredBanks.length === 0 ? (
                                        <View className="px-4 py-4">
                                            <Text className="text-[#9E9E9E] font-satoshi text-[12px]">
                                                No bank matched your search.
                                            </Text>
                                        </View>
                                    ) : (
                                        <ScrollView keyboardShouldPersistTaps="handled">
                                            {filteredBanks.map((item) => (
                                                <TouchableOpacity
                                                    key={`${item.id}-${item.code}`}
                                                    onPress={() => handleSelectBank(item)}
                                                    className="px-4 py-3 border-b border-gray-100"
                                                >
                                                    <Text className="font-satoshi font-bold text-[13px] text-[#424242]">{item.name}</Text>
                                                    <Text className="font-satoshi text-[11px] text-[#9E9E9E]">{item.code}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            ) : null}

                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] mb-1">Account Number</Text>
                            <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 h-12 justify-center mb-3">
                                <TextInput
                                    value={accountNumber}
                                    onChangeText={(value) => {
                                        setAccountNumber(value.replace(/[^0-9]/g, '').slice(0, 10));
                                        setAccountName('');
                                    }}
                                    keyboardType="number-pad"
                                    placeholder="10-digit account number"
                                    className="font-satoshi text-[14px] text-[#424242]"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleVerifyAccount}
                                disabled={!canVerifyAccount || verifyAccountMutation.isPending}
                                className={`h-11 rounded-xl items-center justify-center mb-3 ${
                                    !canVerifyAccount || verifyAccountMutation.isPending ? 'bg-[#A5D6A7]' : 'bg-[#4CAF50]'
                                }`}
                            >
                                {verifyAccountMutation.isPending ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="font-satoshi font-bold text-[12px] text-white">Verify Account</Text>
                                )}
                            </TouchableOpacity>

                            {accountName ? (
                                <View className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-3">
                                    <Text className="font-satoshi text-[12px] text-[#2E7D32]">
                                        Account Name: <Text className="font-bold">{accountName}</Text>
                                    </Text>
                                </View>
                            ) : null}

                            <Text className="text-[#9E9E9E] font-satoshi text-[12px] mb-1">Reason (optional)</Text>
                            <View className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 mb-4">
                                <TextInput
                                    value={reason}
                                    onChangeText={setReason}
                                    placeholder="Withdrawal reason"
                                    multiline
                                    className="font-satoshi text-[13px] text-[#424242]"
                                />
                            </View>

                            <View className="flex-row mb-4">
                                <TouchableOpacity
                                    onPress={() => {
                                        setWithdrawModalVisible(false);
                                        setShowBankList(false);
                                    }}
                                    className="flex-1 h-12 rounded-xl items-center justify-center bg-gray-100 mr-2"
                                >
                                    <Text className="font-satoshi font-bold text-[13px] text-[#424242]">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleWithdraw}
                                    disabled={withdrawMutation.isPending}
                                    className={`flex-1 h-12 rounded-xl items-center justify-center ml-2 ${
                                        withdrawMutation.isPending ? 'bg-[#A5D6A7]' : 'bg-[#4CAF50]'
                                    }`}
                                >
                                    {withdrawMutation.isPending ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="font-satoshi font-bold text-[13px] text-white">Withdraw</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={verifyModalVisible} transparent animationType="fade" onRequestClose={() => setVerifyModalVisible(false)}>
                <View className="flex-1 bg-black/45 items-center justify-center px-8">
                    <View className="bg-white rounded-2xl w-full p-5 items-center">
                        {verifyStatus === 'verifying' ? (
                            <ActivityIndicator color="#4CAF50" size="large" />
                        ) : (
                            <Ionicons
                                name={verifyStatus === 'success' ? 'checkmark-circle' : 'close-circle'}
                                size={56}
                                color={verifyStatus === 'success' ? '#4CAF50' : '#F44336'}
                            />
                        )}
                        <Text className="font-satoshi font-bold text-[16px] text-[#424242] mt-3 mb-2">
                            {verifyStatus === 'verifying'
                                ? 'Verifying Payment'
                                : verifyStatus === 'success'
                                    ? 'Payment Successful'
                                    : 'Payment Verification Failed'}
                        </Text>
                        <Text className="font-satoshi text-[12px] text-[#9E9E9E] text-center mb-4">{verifyMessage}</Text>
                        {verifyStatus !== 'verifying' ? (
                            <TouchableOpacity
                                onPress={() => setVerifyModalVisible(false)}
                                className="bg-[#4CAF50] h-11 px-8 rounded-xl items-center justify-center"
                            >
                                <Text className="text-white font-satoshi font-bold text-[13px]">Close</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};
