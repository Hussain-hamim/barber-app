import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  FlatList,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/constants/theme';
import { SERVICES, Service, BARBERS } from '@/constants/data';
import { ArrowLeft, CreditCard as Edit2, Trash2, Plus, X, DollarSign, Clock } from 'lucide-react-native';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function AdminServicesScreen() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams();
  
  const [services, setServices] = useState<Service[]>([]);
  const [barber, setBarber] = useState(BARBERS.find(b => b.id === Number(barberId)));
  const [modalVisible, setModalVisible] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  
  // Form state
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  
  useEffect(() => {
    if (barberId) {
      // Filter services by barber ID
      const barberServices = SERVICES.filter(
        service => service.barberId === Number(barberId)
      );
      setServices(barberServices);
    }
  }, [barberId]);
  
  const openAddModal = () => {
    setCurrentService(null);
    setServiceName('');
    setServicePrice('');
    setServiceDuration('');
    setServiceDescription('');
    setModalVisible(true);
  };
  
  const openEditModal = (service: Service) => {
    setCurrentService(service);
    setServiceName(service.name);
    setServicePrice(service.price);
    setServiceDuration(service.duration);
    setServiceDescription(service.description || '');
    setModalVisible(true);
  };
  
  const handleSaveService = () => {
    // Validate form
    if (!serviceName || !servicePrice || !serviceDuration) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }
    
    if (currentService) {
      // Update existing service
      const updatedServices = services.map(service => 
        service.id === currentService.id 
          ? { 
              ...service, 
              name: serviceName,
              price: servicePrice,
              duration: serviceDuration,
              description: serviceDescription 
            } 
          : service
      );
      setServices(updatedServices);
    } else {
      // Add new service
      const newService: Service = {
        id: Math.max(...services.map(s => s.id), 0) + 1,
        barberId: Number(barberId),
        name: serviceName,
        price: servicePrice,
        duration: serviceDuration,
        description: serviceDescription,
      };
      
      setServices([...services, newService]);
    }
    
    setModalVisible(false);
  };
  
  const handleDeleteService = (id: number) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const filteredServices = services.filter(service => service.id !== id);
            setServices(filteredServices);
          },
        },
      ]
    );
  };
  
  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.serviceDescription}>{item.description}</Text>
        )}
        
        <View style={styles.serviceDetails}>
          <View style={styles.serviceDetail}>
            <DollarSign size={16} color={Colors.neutral[600]} />
            <Text style={styles.detailText}>{item.price}</Text>
          </View>
          
          <View style={styles.serviceDetail}>
            <Clock size={16} color={Colors.neutral[600]} />
            <Text style={styles.detailText}>{item.duration}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Edit2 size={16} color={Colors.primary[600]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteService(item.id)}
        >
          <Trash2 size={16} color={Colors.error[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.neutral[700]} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Manage Services</Text>
          {barber && <Text style={styles.headerSubtitle}>{barber.name}</Text>}
        </View>
        
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <Button
          title="Add New Service"
          onPress={openAddModal}
          leftIcon={<Plus size={18} color={Colors.white} />}
          style={styles.addButton}
        />
        
        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No services available. Add your first service using the button above.
            </Text>
          </View>
        ) : (
          <FlatList
            data={services}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentService ? 'Edit Service' : 'Add New Service'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={Colors.neutral[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <Input
                label="Service Name"
                placeholder="Haircut"
                value={serviceName}
                onChangeText={setServiceName}
              />
              
              <Input
                label="Price"
                placeholder="$10"
                value={servicePrice}
                onChangeText={setServicePrice}
                keyboardType="decimal-pad"
                leftIcon={<DollarSign size={20} color={Colors.neutral[500]} />}
              />
              
              <Input
                label="Duration"
                placeholder="30 minutes"
                value={serviceDuration}
                onChangeText={setServiceDuration}
                leftIcon={<Clock size={20} color={Colors.neutral[500]} />}
              />
              
              <Input
                label="Description (Optional)"
                placeholder="Describe the service..."
                value={serviceDescription}
                onChangeText={setServiceDescription}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />
              
              <Button
                title="Save Service"
                onPress={handleSaveService}
                style={styles.saveButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
  },
  headerSubtitle: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
  },
  addButton: {
    marginBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: Spacing.xl,
  },
  serviceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  serviceDescription: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  serviceDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  detailText: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginLeft: 4,
  },
  actionButtons: {
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary[50],
  },
  deleteButton: {
    backgroundColor: Colors.error[50],
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalTitle: {
    fontFamily: Typography.families.semibold,
    fontSize: Typography.sizes.lg,
    color: Colors.neutral[800],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: Spacing.lg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
});