import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  StatusBar,
  FlatList,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';

const HomeScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const workspace = useWorkspace();

  const [items, setItems] = useState([
    {
      id: '1',
      name: 'Office Chair',
      quantity: 5,
      category: 'Furniture',
      location: 'Office',
      minStock: 2,
      workspaceId: '1'
    },
    {
      id: '2',
      name: 'Printer Paper',
      quantity: 1,
      category: 'Supplies',
      location: 'Storage',
      minStock: 5,
      workspaceId: '1'
    },
    {
      id: '3',
      name: 'USB Cables',
      quantity: 15,
      category: 'Electronics',
      location: 'Tech Room',
      minStock: 3,
      workspaceId: '1'
    },
    {
      id: '4',
      name: 'Desk Lamp',
      quantity: 8,
      category: 'Furniture',
      location: 'Branch Office',
      minStock: 2,
      workspaceId: '2'
    }
  ]);

  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');

  const filteredItems = useMemo(function() {
    return items.filter(function(item) {
      const matchesWorkspace = item.workspaceId === workspace.currentWorkspaceId;
      const matchesSearch =
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory =
        filterCategory === 'All' || item.category === filterCategory;
      return matchesWorkspace && matchesSearch && matchesCategory;
    });
  }, [items, searchText, filterCategory, workspace.currentWorkspaceId]);

  const categories = useMemo(function() {
    const categorySet = {};
    items
      .filter(function(item) {
        return item.workspaceId === workspace.currentWorkspaceId;
      })
      .forEach(function(item) {
        categorySet[item.category] = true;
      });
    return ['All'].concat(Object.keys(categorySet));
  }, [items, workspace.currentWorkspaceId]);

  const handleUpdateQuantity = function(itemId, qty) {
    if (qty < 0) return;

    setItems(function(prevItems) {
      return prevItems.map(function(item) {
        if (item.id === itemId) {
          return {
            id: item.id,
            name: item.name,
            quantity: qty,
            category: item.category,
            location: item.location,
            minStock: item.minStock,
            workspaceId: item.workspaceId
          };
        }
        return item;
      });
    });

    var item = items.find(function(i) {
      return i.id === itemId;
    });
    if (item && qty < item.minStock) {
      Platform.OS === 'web'
        ? window.alert(
            'Low stock alert: ' +
              item.name +
              ' is below minimum threshold!'
          )
        : Alert.alert(
            'Low Stock Alert',
            item.name + ' is below minimum threshold!'
          );
    }

    setShowUpdateModal(false);
  };

  const handleOpenUpdateModal = function(item) {
    setSelectedItem(item);
    setNewQuantity(item.quantity.toString());
    setShowUpdateModal(true);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text
              style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
            >
              InventoryPro
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: theme.colors.textSecondary }
              ]}
            >
              {filteredItems.length} items in inventory
            </Text>
          </View>
          <Image
            source={{ uri: 'IMAGE:warehouse-storage-boxes' }}
            style={styles.headerImage}
          />
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.colors.card }
          ]}
        >
          <MaterialIcons
            name="search"
            size={20}
            color={theme.colors.textSecondary}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: theme.colors.textPrimary }
            ]}
            placeholder="Search items..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <ScrollView
          horizontal={true}
          style={{ flexGrow: 'initial' }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilters}
        >
          {categories.map(function(category) {
            var isSelected = category === filterCategory;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryFilter,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.card,
                    borderColor: theme.colors.border
                  }
                ]}
                onPress={function() {
                  setFilterCategory(category);
                }}
              >
                <Text
                  style={[
                    styles.categoryFilterText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.colors.textPrimary
                    }
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={function(item) {
          return item.id;
        }}
        renderItem={function(itemData) {
          var item = itemData.item;
          var isLowStock = item.quantity < item.minStock;

          return (
            <TouchableOpacity
              style={[
                styles.itemCard,
                { backgroundColor: theme.colors.card }
              ]}
              onPress={function() {
                handleOpenUpdateModal(item);
              }}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text
                    style={[
                      styles.itemName,
                      { color: theme.colors.textPrimary }
                    ]}
                  >
                    {item.name}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text
                      style={[
                        styles.itemCategory,
                        { color: theme.colors.textSecondary }
                      ]}
                    >
                      {item.category} • {item.location}
                    </Text>
                  </View>
                </View>
                {isLowStock ? (
                  <View
                    style={[
                      styles.lowStockBadge,
                      { backgroundColor: theme.colors.error }
                    ]}
                  >
                    <MaterialIcons
                      name="warning"
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                ) : null}
              </View>
              <View style={styles.quantitySection}>
                <Text
                  style={[
                    styles.quantityLabel,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  Quantity
                </Text>
                <Text
                  style={[
                    styles.quantityValue,
                    {
                      color: isLowStock
                        ? theme.colors.error
                        : theme.colors.textPrimary
                    }
                  ]}
                >
                  {item.quantity.toString()}
                </Text>
                <Text
                  style={[
                    styles.minStockText,
                    { color: theme.colors.textSecondary }
                  ]}
                >
                  Min: {item.minStock}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: Platform.OS === 'web' ? 90 : 100
          }
        ]}
        showsVerticalScrollIndicator={false}
      />

      {showUpdateModal && selectedItem ? (
        <Modal
          visible={showUpdateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={function() {
            setShowUpdateModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.card }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  Update Quantity
                </Text>
                <TouchableOpacity
                  onPress={function() {
                    setShowUpdateModal(false);
                  }}
                >
                  <MaterialIcons
                    name="close"
                    size={24}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text
                  style={[
                    styles.itemNameModal,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  {selectedItem.name}
                </Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      { backgroundColor: theme.colors.border }
                    ]}
                    onPress={function() {
                      var current = parseInt(newQuantity) || 0;
                      if (current > 0)
                        setNewQuantity((current - 1).toString());
                    }}
                  >
                    <MaterialIcons
                      name="remove"
                      size={20}
                      color={theme.colors.textPrimary}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={[
                      styles.quantityInput,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.textPrimary,
                        borderColor: theme.colors.border
                      }
                    ]}
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                    keyboardType="numeric"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={function() {
                      var current = parseInt(newQuantity) || 0;
                      setNewQuantity((current + 1).toString());
                    }}
                  >
                    <MaterialIcons
                      name="add"
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.cancelButton,
                    { borderColor: theme.colors.border }
                  ]}
                  onPress={function() {
                    setShowUpdateModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: theme.colors.textPrimary }
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.updateButton,
                    { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={function() {
                    var quantity = parseInt(newQuantity) || 0;
                    handleUpdateQuantity(selectedItem.id, quantity);
                  }}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerText: {
    flex: 1
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 16
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginLeft: 16
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16
  },
  categoryFilters: {
    paddingRight: 20
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500'
  },
  listContent: {
    paddingHorizontal: 20
  },
  itemCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  itemCategory: {
    fontSize: 14
  },
  lowStockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  quantityLabel: {
    fontSize: 14
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center'
  },
  minStockText: {
    fontSize: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600'
  },
  modalBody: {
    marginBottom: 24
  },
  itemNameModal: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityInput: {
    width: 80,
    height: 40,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 8
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500'
  },
  updateButton: {
    marginLeft: 8
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});

export default HomeScreen;
