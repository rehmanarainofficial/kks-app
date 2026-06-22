import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeDropdown } from '@components/common';
import { logout, selectCurrentUser } from '@store/slices/authSlice';
import { useTheme } from '@config/useTheme';
import { useToggleErpStatusMutation } from '@api/baseApi';
import Toast from 'react-native-toast-message';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT =
  Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.24 : SCREEN_HEIGHT * 0.21;

const MainScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const company = useSelector(state => state.auth.company);

  const [toggleErpStatus] = useToggleErpStatusMutation();

  const [systemEnabled, setSystemEnabled] = useState(true);
  const [selectedMenuCompany, setSelectedMenuCompany] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const orderActions = [
    {
      id: 'new_order',
      title: 'NEW ORDER',
      icon: 'clipboard-outline',
    },
    {
      id: 'order_status',
      title: 'ORDER STATUS',
      icon: 'document-text-outline',
    },
    {
      id: 'supply_info',
      title: 'SUPPLY INFO',
      icon: 'bus-outline',
    },
    {
      id: 'payment',
      title: 'PAYMENT',
      icon: 'cash-outline',
    },
  ];

  const reportActions = [
    {
      id: 'sales_target',
      title: 'SALES VS\nTARGET',
      icon: 'bar-chart-outline',
    },
    {
      id: 'cust_balance',
      title: 'CUSTOMER\nBALANCES',
      icon: 'pie-chart-outline',
    },
  ];

  const expense = [
    {
      id: 'expense',
      title: 'FIELD EXPENSE',
      icon: 'wallet-outline',
    },
    {
      id: 'sample',
      title: 'SAMPLE REQUEST',
      icon: 'flask-outline',
    },
  ];

  const handleToggleSystem = async () => {
    const newState = !systemEnabled;
    const activateValue = newState ? 0 : 1;

    try {
      const response = await toggleErpStatus({
        company: company,
        activate: activateValue,
      }).unwrap();

      if (response && response.status === true) {
        setSystemEnabled(newState);
        Toast.show({
          type: 'success',
          text1: 'System Updated',
          text2: `Application is now turned ${newState ? 'ON' : 'OFF'}.`,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Action Failed',
          text2: 'Could not change system status.',
        });
      }
    } catch (error) {
      console.log('Toggle ERP Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error occurred.',
      });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const menuItems = [
    {
      id: 'Dashboard',
      name: 'Dashboard',
      icon: 'grid-outline',
      screen: 'Dashboard',
    },
    {
      id: 'Approvals',
      name: 'Approvals',
      icon: 'checkmark-circle-outline',
      screen: 'Approvals',
    },
    { id: 'Sales', name: 'Sales', icon: 'cart-outline', screen: 'Sales' },
    {
      id: 'Purchase',
      name: 'Purchase',
      icon: 'bag-handle-outline',
      screen: 'Purchase',
    },
    {
      id: 'Inventory',
      name: 'Inventory',
      icon: 'cube-outline',
      screen: 'Inventory',
    },
    { id: 'HCM', name: 'HCM', icon: 'people-outline', screen: 'HCM' },
    {
      id: 'Manufacturing',
      name: 'Manufacturing',
      icon: 'settings-outline',
      screen: 'Manufacturing',
    },
    { id: 'CRM', name: 'CRM', icon: 'business-outline', screen: 'CRM' },
    {
      id: 'SalesCRM',
      name: 'Sales CRM',
      icon: 'trending-up-outline',
      screen: 'SalesCRM',
    },
    { id: 'Finance', name: 'Finance', icon: 'cash-outline', screen: 'Finance' },
    {
      id: 'Reporting',
      name: 'Reporting',
      icon: 'bar-chart-outline',
      screen: 'Reporting',
    },
    {
      id: 'VoidTransactions',
      name: 'Reversal Transactions',
      icon: 'refresh-circle-outline',
      screen: 'VoidTransactions',
    },
    {
      id: 'Tracking',
      name: 'Tracking',
      icon: 'location-outline',
      screen: 'TrackingScreen',
    },
  ];

  const handleActionPress = item => {
    if (item.id === 'new_order') {
      navigation.navigate('SalesGenerateOrderScreen');
    } else if (item.id === 'cust_balance' || item.id === 'customer_balance') {
      navigation.navigate('CustomerBalanceScreen');
    } else if (item.id === 'contact') {
      navigation.navigate('CRMContactList');
    } else if (item.id === 'hospital') {
      navigation.navigate('CRMHospitalList');
    } else if (item.id === 'payment') {
      navigation.navigate('SalesPayment');
    } else if (item.id === 'order_status') {
      navigation.navigate('SalesTrackOrderStatus');
    } else if (item.id === 'supply_info') {
      navigation.navigate('SupplyInfoScreen');
    } else if (item.id === 'sample') {
      navigation.navigate('CRMSampleRequest');
    } else if (item.id === 'sales_target') {
      navigation.navigate('CRMSalesVsTarget');
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  const dynamicStyles = getStyles(theme);

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const renderCard = action => (
    <TouchableOpacity
      key={action.id}
      style={dynamicStyles.gridItem}
      onPress={() => handleActionPress(action)}
      activeOpacity={0.7}
    >
      <View style={dynamicStyles.iconContainer}>
        <Icon name={action.icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={dynamicStyles.textContainer}>
        <Text style={dynamicStyles.gridItemText}>
          {action.title || action.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Custom Header Section */}
      <View style={dynamicStyles.header}>
        <SafeAreaView style={dynamicStyles.headerContent} edges={['top']}>
          <View style={dynamicStyles.topBar}>
            <View
              style={[
                dynamicStyles.companyInfo,
                { flexDirection: 'row', alignItems: 'center' },
              ]}
            >
              {selectedMenuCompany && (
                <TouchableOpacity
                  onPress={() => setSelectedMenuCompany(null)}
                  style={{ marginRight: 10 }}
                >
                  <Icon name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <Text style={dynamicStyles.companyName}>
                {selectedMenuCompany
                  ? selectedMenuCompany.length > 12
                    ? selectedMenuCompany.slice(0, 12) + '...'
                    : selectedMenuCompany
                  : 'KKS'}
              </Text>
            </View>
            <View style={dynamicStyles.headerActions}>
              {/* Notification Bell */}
              <TouchableOpacity style={dynamicStyles.iconBtn}>
                <Icon name="notifications-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Theme Switcher */}
              <View style={dynamicStyles.themeIcon}>
                <ThemeDropdown />
              </View>

              {/* Menu Toggle Switch */}
              <Switch
                value={showMenu}
                onValueChange={setShowMenu}
                trackColor={{
                  false: 'rgba(255, 255, 255, 0.3)',
                  true: theme.colors.secondary || '#FFFFFF',
                }}
                thumbColor={showMenu ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="rgba(255, 255, 255, 0.2)"
                style={{
                  marginLeft: 8,
                  transform:
                    Platform.OS === 'ios'
                      ? [{ scaleX: 0.8 }, { scaleY: 0.8 }]
                      : [{ scaleX: 0.9 }, { scaleY: 0.9 }],
                }}
              />

              {/* Logout */}
              <TouchableOpacity
                style={[dynamicStyles.iconBtn, dynamicStyles.logoutBtn]}
                onPress={handleLogout}
              >
                <Icon name="log-out-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={dynamicStyles.userInfoContainer}>
            <Text style={dynamicStyles.userName}>
              Welcome back, {user?.user_id || 'User'}
            </Text>
            <Text style={dynamicStyles.dateText}>{todayDate}</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Grid Section */}
      <ScrollView
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showMenu ? (
          <>
            {chunkArray(menuItems, 2).map((row, rowIndex) => (
              <View key={rowIndex} style={dynamicStyles.gridRow}>
                {row.map(item => renderCard(item))}
              </View>
            ))}
          </>
        ) : (
          <>
            {/* ATTENDANCE SECTION (Beautiful full-width banner) */}
            <TouchableOpacity
              style={dynamicStyles.attendanceCard}
              onPress={() => navigation.navigate('HCMAttendance')}
              activeOpacity={0.7}
            >
              <View style={dynamicStyles.attendanceIconContainer}>
                <Icon
                  name="calendar-number"
                  size={24}
                  color={theme.colors.success}
                />
              </View>
              <View style={dynamicStyles.attendanceTextContainer}>
                <Text style={dynamicStyles.attendanceTitle}>
                  Mark Attendance
                </Text>
                <Text style={dynamicStyles.attendanceSubtitle}>
                  Tap to check-in or out for the day
                </Text>
              </View>
              <Icon
                name="chevron-forward-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>

            {/* ORDERS SECTION */}
            <Text style={dynamicStyles.sectionHeader}>ORDERS</Text>
            <View style={dynamicStyles.gridRow}>
              {orderActions.slice(0, 2).map(action => renderCard(action))}
            </View>
            <View style={dynamicStyles.gridRow}>
              {orderActions.slice(2, 4).map(action => renderCard(action))}
            </View>

            {/* REPORTS SECTION */}
            <Text style={dynamicStyles.sectionHeader}>REPORTS</Text>
            <View style={dynamicStyles.gridRow}>
              {reportActions.map(action => renderCard(action))}
            </View>

            {/* FIELD EXPENSE & SAMPLE SECTION */}
            <Text style={dynamicStyles.sectionHeader}>
              FIELD EXPENSE & SAMPLE
            </Text>
            <View style={dynamicStyles.gridRow}>
              {expense.map(item => renderCard(item))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = theme =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      height: HEADER_HEIGHT,
      backgroundColor: theme.colors.primary,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      ...theme.shadows.lg,
    },
    headerContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    companyInfo: {
      flex: 1,
    },
    companyName: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    dateText: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.75)',
      marginTop: 4,
    },
    userInfoContainer: {
      marginTop: 20,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBtn: {
      padding: 8,
      marginLeft: 4,
    },
    themeIcon: {
      width: 'auto',
      marginLeft: 4,
    },
    logoutBtn: {
      marginLeft: 8,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    attendanceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    attendanceIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.colors.success + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    attendanceTextContainer: {
      flex: 1,
      marginLeft: 16,
    },
    attendanceTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.text,
    },
    attendanceSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 12,
      marginTop: 20,
    },
    gridRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    gridItem: {
      width: '48%',
      height: 76,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.colors.primary + '12',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    gridItemText: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.text,
      lineHeight: 15,
    },
  });

export default MainScreen;
