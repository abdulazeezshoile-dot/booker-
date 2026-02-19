import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';

const AddItemScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const workspace = useWorkspace();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minStock, setMinStock] = useState('1');

  const handleAddItem = function() {
    if (!name.trim() || !category.trim() || !location.trim()) {
      Platform.OS === 'web'
        ? window.alert('Please fill in all required fields')
        : Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      name: name.trim(),
      quantity: parseInt(quantity) || 1,
      category: category.trim(),
      location: location.trim(),
      minStock: parseInt(minStock) || 1,
      workspaceId: workspace.currentWorkspaceId
    };

    Platform.OS === 'web'
      ? window.alert('Item added successfully!')
      : Alert.alert('Success', 'Item added successfully!');

    setName('');
    setQuantity('1');
    setCategory('');
    setLocation('');
    setMinStock('1');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.screenHeader}>
        <Text
          style={[styles.screenTitle, { color: theme.colors.textPrimary }]}
        >
          Add New Item
        </Text>
        <Text
          style={[styles.screenSubtitle, { color: theme.colors.textSecondary }]}
        >
          Add items to your inventory
        </Text>
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
      >
        <ScrollView
          style={styles.formContainer}
          contentContainerStyle={{
            paddingBottom: Platform.OS === 'web' ? 90 : 100
          }}
        >
          <View
            style={[styles.formCard, { backgroundColor: theme.colors.card }]}
          >
            <View style={styles.formField}>
              <Text
                style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}
              >
                Item Name *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary
                  }
                ]}
                placeholder="Enter item name"
                placeholderTextColor={theme.colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formFieldHalf}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  Quantity
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }
                  ]}
                  placeholder="1"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formFieldHalf}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.textPrimary }
                  ]}
                >
                  Min Stock
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary
                    }
                  ]}
                  placeholder="1"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={minStock}
                  onChangeText={setMinStock}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formField}>
              <Text
                style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}
              >
                Category *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary
                  }
                ]}
                placeholder="e.g. Electronics, Furniture, Supplies"
                placeholderTextColor={theme.colors.textSecondary}
                value={category}
                onChangeText={setCategory}
              />
            </View>

            <View style={styles.formField}>
              <Text
                style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}
              >
                Location *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary
                  }
                ]}
                placeholder="e.g. Storage Room, Office, Warehouse A"
                placeholderTextColor={theme.colors.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddItem}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%'
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4
  },
  screenSubtitle: {
    fontSize: 16
  },
  keyboardAvoidingView: {
    flex: 1
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  formField: {
    marginBottom: 20
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  formFieldHalf: {
    flex: 1,
    marginHorizontal: 4
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8
  }
});

export default AddItemScreen;
