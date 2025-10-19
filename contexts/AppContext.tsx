import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Company, PlantInspection, QuickHitchInspection, VehicleInspection, BucketChangeInspection, Project, Equipment, Notification, PositiveIntervention, FixLog, ApprenticeshipEntry, Announcement, Draft, DraftType, GreasingRecord, GreasingInspection, Ticket, TicketReminder, AirTestingInspection, EquipmentCategory, EquipmentItem, EquipmentCertificate, HolidayRequest, HolidayNotification, HolidayStatus, PlantCategory, PlantItem, PlantCertificate, EquipmentReport } from '@/types';

const STORAGE_KEYS = {
  USER: '@checkmate_user',
  COMPANY: '@checkmate_company',
  PLANT_INSPECTIONS: '@checkmate_plant_inspections',
  QUICK_HITCH_INSPECTIONS: '@checkmate_quick_hitch_inspections',
  VEHICLE_INSPECTIONS: '@checkmate_vehicle_inspections',
  BUCKET_CHANGE_INSPECTIONS: '@checkmate_bucket_change_inspections',
  COMPANIES: '@checkmate_companies',
  USERS: '@checkmate_users',
  NOTIFICATIONS: '@checkmate_notifications',
  POSITIVE_INTERVENTIONS: '@checkmate_positive_interventions',
  FIX_LOGS: '@checkmate_fix_logs',
  APPRENTICESHIP_ENTRIES: '@checkmate_apprenticeship_entries',
  ANNOUNCEMENTS: '@checkmate_announcements',
  DRAFTS: '@checkmate_drafts',
  GREASING_RECORDS: '@checkmate_greasing_records',
  GREASING_INSPECTIONS: '@checkmate_greasing_inspections',
  TICKETS: '@checkmate_tickets',
  TICKET_REMINDERS: '@checkmate_ticket_reminders',
  AIR_TESTING_INSPECTIONS: '@checkmate_air_testing_inspections',
  EQUIPMENT_CATEGORIES: '@checkmate_equipment_categories',
  EQUIPMENT_ITEMS: '@checkmate_equipment_items',
  HOLIDAY_REQUESTS: '@checkmate_holiday_requests',
  HOLIDAY_NOTIFICATIONS: '@checkmate_holiday_notifications',
  PLANT_CATEGORIES: '@checkmate_plant_categories',
  PLANT_ITEMS: '@checkmate_plant_items',
  EQUIPMENT_REPORTS: '@checkmate_equipment_reports',
} as const;

export const [AppProvider, useApp] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plantInspections, setPlantInspections] = useState<PlantInspection[]>([]);
  const [quickHitchInspections, setQuickHitchInspections] = useState<QuickHitchInspection[]>([]);
  const [vehicleInspections, setVehicleInspections] = useState<VehicleInspection[]>([]);
  const [bucketChangeInspections, setBucketChangeInspections] = useState<BucketChangeInspection[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [positiveInterventions, setPositiveInterventions] = useState<PositiveIntervention[]>([]);
  const [fixLogs, setFixLogs] = useState<FixLog[]>([]);
  const [apprenticeshipEntries, setApprenticeshipEntries] = useState<ApprenticeshipEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [greasingRecords, setGreasingRecords] = useState<GreasingRecord[]>([]);
  const [greasingInspections, setGreasingInspections] = useState<GreasingInspection[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketReminders, setTicketReminders] = useState<TicketReminder[]>([]);
  const [airTestingInspections, setAirTestingInspections] = useState<AirTestingInspection[]>([]);
  const [equipmentCategories, setEquipmentCategories] = useState<EquipmentCategory[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [holidayRequests, setHolidayRequests] = useState<HolidayRequest[]>([]);
  const [holidayNotifications, setHolidayNotifications] = useState<HolidayNotification[]>([]);
  const [plantCategories, setPlantCategories] = useState<PlantCategory[]>([]);
  const [plantItems, setPlantItems] = useState<PlantItem[]>([]);
  const [equipmentReports, setEquipmentReports] = useState<EquipmentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, companyData, companiesData, usersData, plantData, quickHitchData, vehicleData, bucketData, notificationsData, positiveInterventionsData, fixLogsData, apprenticeshipData, announcementsData, draftsData, greasingData, greasingInspectionsData, ticketsData, ticketRemindersData, airTestingData, equipmentCategoriesData, equipmentItemsData, holidayRequestsData, holidayNotificationsData, plantCategoriesData, plantItemsData, equipmentReportsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.COMPANY),
        AsyncStorage.getItem(STORAGE_KEYS.COMPANIES),
        AsyncStorage.getItem(STORAGE_KEYS.USERS),
        AsyncStorage.getItem(STORAGE_KEYS.PLANT_INSPECTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.QUICK_HITCH_INSPECTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.VEHICLE_INSPECTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.BUCKET_CHANGE_INSPECTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.POSITIVE_INTERVENTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.FIX_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.APPRENTICESHIP_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.DRAFTS),
        AsyncStorage.getItem(STORAGE_KEYS.GREASING_RECORDS),
        AsyncStorage.getItem(STORAGE_KEYS.GREASING_INSPECTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.TICKETS),
        AsyncStorage.getItem(STORAGE_KEYS.TICKET_REMINDERS),
        AsyncStorage.getItem(STORAGE_KEYS.AIR_TESTING_INSPECTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.EQUIPMENT_CATEGORIES),
        AsyncStorage.getItem(STORAGE_KEYS.EQUIPMENT_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.HOLIDAY_REQUESTS),
        AsyncStorage.getItem(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.PLANT_CATEGORIES),
        AsyncStorage.getItem(STORAGE_KEYS.PLANT_ITEMS),
        AsyncStorage.getItem(STORAGE_KEYS.EQUIPMENT_REPORTS),
      ]);

      const safeJSONParse = (data: string | null, storageKey: string) => {
        if (!data) return null;
        if (typeof data !== 'string') {
          console.error(`❌ Invalid data type for ${storageKey}:`, typeof data);
          AsyncStorage.removeItem(storageKey).catch(() => {});
          return null;
        }
        if (data.trim() === '') {
          console.error(`❌ Empty string for ${storageKey}`);
          AsyncStorage.removeItem(storageKey).catch(() => {});
          return null;
        }
        if (data === 'undefined' || data === 'null' || data === '[object Object]') {
          console.error(`❌ Invalid literal string for ${storageKey}:`, data);
          AsyncStorage.removeItem(storageKey).catch(() => {});
          return null;
        }
        try {
          const parsed = JSON.parse(data);
          return parsed;
        } catch (error) {
          console.error(`❌ JSON Parse error for ${storageKey}:`, error);
          console.error(`❌ Invalid data (first 200 chars):`, data.substring(0, 200));
          AsyncStorage.removeItem(storageKey).catch(() => {});
          return null;
        }
      };

      const parsedUser = safeJSONParse(userData, STORAGE_KEYS.USER);
      if (parsedUser) setUser(parsedUser);

      const parsedCompany = safeJSONParse(companyData, STORAGE_KEYS.COMPANY);
      if (parsedCompany) {
        setCompany({
          ...parsedCompany,
          projects: parsedCompany.projects || [],
          equipment: parsedCompany.equipment || [],
        });
      }

      const parsedCompanies = safeJSONParse(companiesData, STORAGE_KEYS.COMPANIES);
      if (parsedCompanies) setCompanies(parsedCompanies);

      const parsedUsers = safeJSONParse(usersData, STORAGE_KEYS.USERS);
      if (parsedUsers) setUsers(parsedUsers);

      const parsedPlant = safeJSONParse(plantData, STORAGE_KEYS.PLANT_INSPECTIONS);
      if (parsedPlant) setPlantInspections(parsedPlant);

      const parsedQuickHitch = safeJSONParse(quickHitchData, STORAGE_KEYS.QUICK_HITCH_INSPECTIONS);
      if (parsedQuickHitch) setQuickHitchInspections(parsedQuickHitch);

      const parsedVehicle = safeJSONParse(vehicleData, STORAGE_KEYS.VEHICLE_INSPECTIONS);
      if (parsedVehicle) setVehicleInspections(parsedVehicle);

      const parsedBucket = safeJSONParse(bucketData, STORAGE_KEYS.BUCKET_CHANGE_INSPECTIONS);
      if (parsedBucket) setBucketChangeInspections(parsedBucket);

      const parsedNotifications = safeJSONParse(notificationsData, STORAGE_KEYS.NOTIFICATIONS);
      if (parsedNotifications) setNotifications(parsedNotifications);

      const parsedInterventions = safeJSONParse(positiveInterventionsData, STORAGE_KEYS.POSITIVE_INTERVENTIONS);
      if (parsedInterventions) setPositiveInterventions(parsedInterventions);

      const parsedFixLogs = safeJSONParse(fixLogsData, STORAGE_KEYS.FIX_LOGS);
      if (parsedFixLogs) setFixLogs(parsedFixLogs);

      const parsedApprenticeshipEntries = safeJSONParse(apprenticeshipData, STORAGE_KEYS.APPRENTICESHIP_ENTRIES);
      if (parsedApprenticeshipEntries) setApprenticeshipEntries(parsedApprenticeshipEntries);

      const parsedAnnouncements = safeJSONParse(announcementsData, STORAGE_KEYS.ANNOUNCEMENTS);
      if (parsedAnnouncements) setAnnouncements(parsedAnnouncements);

      const parsedDrafts = safeJSONParse(draftsData, STORAGE_KEYS.DRAFTS);
      if (parsedDrafts) setDrafts(parsedDrafts);

      const parsedGreasingRecords = safeJSONParse(greasingData, STORAGE_KEYS.GREASING_RECORDS);
      if (parsedGreasingRecords) setGreasingRecords(parsedGreasingRecords);

      const parsedGreasingInspections = safeJSONParse(greasingInspectionsData, STORAGE_KEYS.GREASING_INSPECTIONS);
      if (parsedGreasingInspections) setGreasingInspections(parsedGreasingInspections);

      const parsedTickets = safeJSONParse(ticketsData, STORAGE_KEYS.TICKETS);
      if (parsedTickets) setTickets(parsedTickets);

      const parsedTicketReminders = safeJSONParse(ticketRemindersData, STORAGE_KEYS.TICKET_REMINDERS);
      if (parsedTicketReminders) setTicketReminders(parsedTicketReminders);

      const parsedAirTesting = safeJSONParse(airTestingData, STORAGE_KEYS.AIR_TESTING_INSPECTIONS);
      if (parsedAirTesting) setAirTestingInspections(parsedAirTesting);

      const parsedEquipmentCategories = safeJSONParse(equipmentCategoriesData, STORAGE_KEYS.EQUIPMENT_CATEGORIES);
      if (parsedEquipmentCategories) setEquipmentCategories(parsedEquipmentCategories);

      const parsedEquipmentItems = safeJSONParse(equipmentItemsData, STORAGE_KEYS.EQUIPMENT_ITEMS);
      if (parsedEquipmentItems) setEquipmentItems(parsedEquipmentItems);

      const parsedHolidayRequests = safeJSONParse(holidayRequestsData, STORAGE_KEYS.HOLIDAY_REQUESTS);
      if (parsedHolidayRequests) setHolidayRequests(parsedHolidayRequests);

      const parsedHolidayNotifications = safeJSONParse(holidayNotificationsData, STORAGE_KEYS.HOLIDAY_NOTIFICATIONS);
      if (parsedHolidayNotifications) setHolidayNotifications(parsedHolidayNotifications);

      const parsedPlantCategories = safeJSONParse(plantCategoriesData, STORAGE_KEYS.PLANT_CATEGORIES);
      if (parsedPlantCategories) setPlantCategories(parsedPlantCategories);

      const parsedPlantItems = safeJSONParse(plantItemsData, STORAGE_KEYS.PLANT_ITEMS);
      if (parsedPlantItems) setPlantItems(parsedPlantItems);

      const parsedEquipmentReports = safeJSONParse(equipmentReportsData, STORAGE_KEYS.EQUIPMENT_REPORTS);
      if (parsedEquipmentReports) setEquipmentReports(parsedEquipmentReports);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCompanyCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const registerCompany = useCallback(async (ownerName: string, companyName: string, companyEmail: string, personalEmail: string, password: string) => {
    const code = generateCompanyCode();
    const newCompany: Company = {
      id: Date.now().toString(),
      name: companyName,
      code,
      email: companyEmail,
      projects: [],
      equipment: [],
      createdAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: Date.now().toString(),
      role: 'company',
      companyId: newCompany.id,
      name: ownerName,
      email: personalEmail,
      password,
      createdAt: new Date().toISOString(),
    };

    const updatedCompanies = [...companies, newCompany];
    const updatedUsers = [...users, newUser];

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(newCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies)),
      AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers)),
    ]);

    setUser(newUser);
    setCompany(newCompany);
    setCompanies(updatedCompanies);
    setUsers(updatedUsers);

    return newCompany;
  }, [companies, users]);

  const joinCompany = useCallback(async (code: string, employeeName: string, email: string, password: string, profilePicture?: string) => {
    const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
    const allCompanies = companiesData ? JSON.parse(companiesData) : [];
    
    const foundCompany = allCompanies.find((c: Company) => c.code === code);
    if (!foundCompany) {
      console.log('Available companies:', allCompanies);
      console.log('Searching for code:', code);
      throw new Error('Invalid company code');
    }

    const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const allUsers = usersData ? JSON.parse(usersData) : [];

    const existingUser = allUsers.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      if (existingUser.companyIds?.includes(foundCompany.id)) {
        throw new Error('Already joined this company');
      }
      
      const updatedUser = {
        ...existingUser,
        companyIds: [...(existingUser.companyIds || [existingUser.companyId!]), foundCompany.id],
        currentCompanyId: foundCompany.id,
        companyId: foundCompany.id,
      };

      const updatedUsers = allUsers.map((u: User) => u.id === existingUser.id ? updatedUser : u);

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser)),
        AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(foundCompany)),
        AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers)),
      ]);

      setUser(updatedUser);
      setCompany(foundCompany);
      setUsers(updatedUsers);

      return foundCompany;
    }

    const newUser: User = {
      id: Date.now().toString(),
      role: 'employee',
      companyId: foundCompany.id,
      companyIds: [foundCompany.id],
      currentCompanyId: foundCompany.id,
      name: employeeName,
      email,
      password,
      profilePicture,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...allUsers, newUser];

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(foundCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers)),
    ]);

    setUser(newUser);
    setCompany(foundCompany);
    setUsers(updatedUsers);

    return foundCompany;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    console.log('🔍 Login attempt for email:', trimmedEmail);
    
    const allUsers: User[] = usersData ? JSON.parse(usersData) : [];
    console.log('📊 Total users in database:', allUsers.length);

    const foundUser = allUsers.find((u: User) => 
      u.email.trim().toLowerCase() === trimmedEmail && 
      u.password.trim() === trimmedPassword
    );
    
    if (!foundUser) {
      const emailMatch = allUsers.find((u: User) => 
        u.email.trim().toLowerCase() === trimmedEmail
      );
      
      if (emailMatch) {
        console.error('❌ Email found but password mismatch');
        console.error('Expected password length:', emailMatch.password?.trim().length);
        console.error('Provided password length:', trimmedPassword.length);
      } else {
        console.error('❌ Email not found in database');
        console.error('Available emails:', allUsers.map(u => u.email.trim().toLowerCase()).join(', '));
      }
      throw new Error('Invalid email or password');
    }

    console.log('✅ User found:', foundUser.email);

    const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
    const allCompanies: Company[] = companiesData ? JSON.parse(companiesData) : [];
    const foundCompany = allCompanies.find((c: Company) => c.id === foundUser.companyId);

    if (!foundCompany) {
      console.error('❌ Company not found for user:', foundUser.companyId);
      console.error('Available companies:', allCompanies.map(c => ({ id: c.id, name: c.name })));
      throw new Error('Company not found');
    }

    console.log('✅ Company found:', foundCompany.name);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(foundUser)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(foundCompany)),
    ]);

    setUser(foundUser);
    setCompany(foundCompany);
    setUsers(allUsers);

    console.log('✅ Login successful for:', foundUser.email);
    return foundUser;
  }, []);

  const submitPlantInspection = useCallback(async (inspection: Omit<PlantInspection, 'id' | 'createdAt'>) => {
    const newInspection: PlantInspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...plantInspections, newInspection];
    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_INSPECTIONS, JSON.stringify(updated));
    setPlantInspections(updated);

    const failedChecks = newInspection.checks.filter(c => c.status === 'B' || c.status === 'C');
    if (failedChecks.length > 0) {
      const equipmentName = company?.equipment?.find(e => e.id === inspection.equipmentId)?.name || `Plant #${inspection.plantNumber}`;
      const newNotification: Notification = {
        id: Date.now().toString(),
        companyId: newInspection.companyId,
        inspectionId: newInspection.id,
        inspectionType: 'plant',
        equipmentName,
        issue: `${failedChecks.length} failed check(s)`,
        severity: failedChecks.some(c => c.status === 'C') ? 'high' : 'medium',
        reportedBy: newInspection.employeeName,
        reportedAt: newInspection.createdAt,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      const updatedNotifications = [...notifications, newNotification];
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }

    return newInspection;
  }, [plantInspections, company, notifications]);

  const submitQuickHitchInspection = useCallback(async (inspection: Omit<QuickHitchInspection, 'id' | 'createdAt'>) => {
    const newInspection: QuickHitchInspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...quickHitchInspections, newInspection];
    await AsyncStorage.setItem(STORAGE_KEYS.QUICK_HITCH_INSPECTIONS, JSON.stringify(updated));
    setQuickHitchInspections(updated);

    const failedChecks = newInspection.checks.filter(c => c.status === '✗' || c.status === false);
    if (failedChecks.length > 0) {
      const equipmentName = company?.equipment?.find(e => e.id === inspection.equipmentId)?.name || inspection.excavatorDetails;
      const newNotification: Notification = {
        id: Date.now().toString(),
        companyId: newInspection.companyId,
        inspectionId: newInspection.id,
        inspectionType: 'quickhitch',
        equipmentName,
        issue: `${failedChecks.length} failed check(s)`,
        severity: 'medium',
        reportedBy: newInspection.operatorName,
        reportedAt: newInspection.createdAt,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      const updatedNotifications = [...notifications, newNotification];
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }

    return newInspection;
  }, [quickHitchInspections, company, notifications]);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      AsyncStorage.removeItem(STORAGE_KEYS.COMPANY),
    ]);
    setUser(null);
    setCompany(null);
  }, []);

  const submitVehicleInspection = useCallback(async (inspection: Omit<VehicleInspection, 'id' | 'createdAt'>) => {
    const newInspection: VehicleInspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...vehicleInspections, newInspection];
    await AsyncStorage.setItem(STORAGE_KEYS.VEHICLE_INSPECTIONS, JSON.stringify(updated));
    setVehicleInspections(updated);

    const failedChecks = newInspection.checks.filter(c => c.status === 'B' || c.status === 'C');
    if (failedChecks.length > 0) {
      const equipmentName = company?.equipment?.find(e => e.id === inspection.equipmentId)?.name || inspection.vehicleRegistration;
      const newNotification: Notification = {
        id: Date.now().toString(),
        companyId: newInspection.companyId,
        inspectionId: newInspection.id,
        inspectionType: 'vehicle',
        equipmentName,
        issue: `${failedChecks.length} failed check(s)`,
        severity: failedChecks.some(c => c.status === 'C') ? 'high' : 'medium',
        reportedBy: newInspection.employeeName,
        reportedAt: newInspection.createdAt,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      const updatedNotifications = [...notifications, newNotification];
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }

    return newInspection;
  }, [vehicleInspections, company, notifications]);

  const getCompanyInspections = useCallback(() => {
    if (!company) return { plant: [], quickHitch: [], vehicle: [], bucketChange: [] };

    return {
      plant: plantInspections.filter(i => i.companyId === company.id),
      quickHitch: quickHitchInspections.filter(i => i.companyId === company.id),
      vehicle: vehicleInspections.filter(i => i.companyId === company.id),
      bucketChange: bucketChangeInspections.filter(i => i.companyId === company.id),
    };
  }, [company, plantInspections, quickHitchInspections, vehicleInspections, bucketChangeInspections]);

  const getEmployeeInspections = useCallback((employeeId: string) => {
    return {
      plant: plantInspections.filter(i => i.employeeId === employeeId),
      quickHitch: quickHitchInspections.filter(i => i.employeeId === employeeId),
      vehicle: vehicleInspections.filter(i => i.employeeId === employeeId),
      bucketChange: bucketChangeInspections.filter(i => i.employeeId === employeeId),
    };
  }, [plantInspections, quickHitchInspections, vehicleInspections, bucketChangeInspections]);

  const addProject = useCallback(async (name: string, projectNumber: string, emails: string[]) => {
    if (!company) throw new Error('No company found');

    const newProject: Project = {
      id: Date.now().toString(),
      name,
      projectNumber,
      emails,
      createdAt: new Date().toISOString(),
    };

    const sortedProjects = [...(company.projects || []), newProject].sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    const updatedCompany = {
      ...company,
      projects: sortedProjects,
    };

    const updatedCompanies = companies.map(c => 
      c.id === company.id ? updatedCompany : c
    );

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updatedCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies)),
    ]);

    setCompany(updatedCompany);
    setCompanies(updatedCompanies);

    return newProject;
  }, [company, companies]);

  const updateProject = useCallback(async (projectId: string, name: string, projectNumber: string, emails: string[], assignedEmployeeIds?: string[]) => {
    if (!company) throw new Error('No company found');

    const updatedCompany = {
      ...company,
      projects: (company.projects || []).map(p => 
        p.id === projectId ? { ...p, name, projectNumber, emails, assignedEmployeeIds } : p
      ),
    };

    const updatedCompanies = companies.map(c => 
      c.id === company.id ? updatedCompany : c
    );

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updatedCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies)),
    ]);

    setCompany(updatedCompany);
    setCompanies(updatedCompanies);
  }, [company, companies]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!company) throw new Error('No company found');

    const updatedCompany = {
      ...company,
      projects: (company.projects || []).filter(p => p.id !== projectId),
    };

    const updatedCompanies = companies.map(c => 
      c.id === company.id ? updatedCompany : c
    );

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updatedCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies)),
    ]);

    setCompany(updatedCompany);
    setCompanies(updatedCompanies);
  }, [company, companies]);

  const getCompanyUsers = useCallback(() => {
    if (!company) return [];
    return users.filter(u => u.companyId === company.id);
  }, [company, users]);

  const changeUserRole = useCallback(async (userId: string, newRole: 'administrator' | 'management' | 'supervisor' | 'mechanic' | 'employee' | 'apprentice' | 'viewer') => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    );

    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    if (user?.id === userId) {
      const updatedUser = { ...user, role: newRole };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }, [users, user]);

  const removeEmployee = useCallback(async (userId: string) => {
    const updatedUsers = users.filter(u => u.id !== userId);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  }, [users]);

  const addEquipment = useCallback(async (equipment: Omit<Equipment, 'id' | 'createdAt'>) => {
    if (!company) throw new Error('No company found');

    const newEquipment: Equipment = {
      ...equipment,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const sortedEquipment = [...(company.equipment || []), newEquipment].sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    const updatedCompany = {
      ...company,
      equipment: sortedEquipment,
    };

    const updatedCompanies = companies.map(c => 
      c.id === company.id ? updatedCompany : c
    );

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updatedCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies)),
    ]);

    setCompany(updatedCompany);
    setCompanies(updatedCompanies);

    return newEquipment;
  }, [company, companies]);

  const updateEquipment = useCallback(async (equipmentId: string, updates: Partial<Equipment>) => {
    if (!company) throw new Error('No company found');

    const updatedCompany = {
      ...company,
      equipment: (company.equipment || []).map(e => 
        e.id === equipmentId ? { ...e, ...updates } : e
      ),
    };

    const updatedCompanies = companies.map(c => 
      c.id === company.id ? updatedCompany : c
    );

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updatedCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies)),
    ]);

    setCompany(updatedCompany);
    setCompanies(updatedCompanies);
  }, [company, companies]);

  const deleteEquipment = useCallback(async (equipmentId: string) => {
    if (!company) throw new Error('No company found');

    const updatedCompany = {
      ...company,
      equipment: (company.equipment || []).filter(e => e.id !== equipmentId),
    };

    const updatedCompanies = companies.map(c => 
      c.id === company.id ? updatedCompany : c
    );

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updatedCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies)),
    ]);

    setCompany(updatedCompany);
    setCompanies(updatedCompanies);
  }, [company, companies]);

  const submitBucketChangeInspection = useCallback(async (inspection: Omit<BucketChangeInspection, 'id' | 'createdAt'>) => {
    const newInspection: BucketChangeInspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...bucketChangeInspections, newInspection];
    await AsyncStorage.setItem(STORAGE_KEYS.BUCKET_CHANGE_INSPECTIONS, JSON.stringify(updated));
    setBucketChangeInspections(updated);

    const failedChecks = newInspection.checks.filter(c => c.status === false);
    if (failedChecks.length > 0) {
      const equipmentName = company?.equipment?.find(e => e.id === inspection.equipmentId)?.name || inspection.bucketType;
      const newNotification: Notification = {
        id: Date.now().toString(),
        companyId: newInspection.companyId,
        inspectionId: newInspection.id,
        inspectionType: 'bucket',
        equipmentName,
        issue: `${failedChecks.length} failed check(s)`,
        severity: 'high',
        reportedBy: newInspection.employeeName,
        reportedAt: newInspection.createdAt,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      const updatedNotifications = [...notifications, newNotification];
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }

    return newInspection;
  }, [bucketChangeInspections, company, notifications]);

  const switchCompany = useCallback(async (companyId: string) => {
    if (!user) throw new Error('No user found');

    const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
    const allCompanies: Company[] = companiesData ? JSON.parse(companiesData) : [];
    const foundCompany = allCompanies.find((c: Company) => c.id === companyId);

    if (!foundCompany) {
      throw new Error('Company not found');
    }

    const updatedUser = {
      ...user,
      companyId,
      currentCompanyId: companyId,
    };

    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(foundCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers)),
    ]);

    setUser(updatedUser);
    setCompany(foundCompany);
    setUsers(updatedUsers);

    return foundCompany;
  }, [user, users]);

  const getUserCompanies = useCallback(() => {
    if (!user) return [];
    const companyIds = user.companyIds || (user.companyId ? [user.companyId] : []);
    return companies.filter(c => companyIds.includes(c.id));
  }, [user, companies]);

  const updateUserProfile = useCallback(async (updates: { name?: string; profilePicture?: string }) => {
    if (!user) throw new Error('No user found');

    const updatedUser = {
      ...user,
      ...updates,
    };

    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser)),
      AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers)),
    ]);

    setUser(updatedUser);
    setUsers(updatedUsers);

    return updatedUser;
  }, [user, users]);

  const getCompanyNotifications = useCallback(() => {
    if (!company) return [];
    return notifications.filter(n => n.companyId === company.id);
  }, [company, notifications]);

  const markNotificationComplete = useCallback(async (notificationId: string) => {
    if (!user) throw new Error('No user found');

    const updatedNotifications = notifications.map(n =>
      n.id === notificationId
        ? {
            ...n,
            isCompleted: true,
            completedBy: user.name,
            completedAt: new Date().toISOString(),
          }
        : n
    );

    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
  }, [notifications, user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
  }, [notifications]);

  const deleteInspection = useCallback(async (inspectionId: string, type: string) => {
    if (type === 'plant') {
      const updated = plantInspections.filter(i => i.id !== inspectionId);
      await AsyncStorage.setItem(STORAGE_KEYS.PLANT_INSPECTIONS, JSON.stringify(updated));
      setPlantInspections(updated);
    } else if (type === 'quickhitch') {
      const updated = quickHitchInspections.filter(i => i.id !== inspectionId);
      await AsyncStorage.setItem(STORAGE_KEYS.QUICK_HITCH_INSPECTIONS, JSON.stringify(updated));
      setQuickHitchInspections(updated);
    } else if (type === 'vehicle') {
      const updated = vehicleInspections.filter(i => i.id !== inspectionId);
      await AsyncStorage.setItem(STORAGE_KEYS.VEHICLE_INSPECTIONS, JSON.stringify(updated));
      setVehicleInspections(updated);
    } else if (type === 'bucketchange') {
      const updated = bucketChangeInspections.filter(i => i.id !== inspectionId);
      await AsyncStorage.setItem(STORAGE_KEYS.BUCKET_CHANGE_INSPECTIONS, JSON.stringify(updated));
      setBucketChangeInspections(updated);
    }

    const updatedNotifications = notifications.filter(n => n.inspectionId !== inspectionId);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
    setNotifications(updatedNotifications);
  }, [plantInspections, quickHitchInspections, vehicleInspections, bucketChangeInspections, notifications]);

  const markInspectionFixed = useCallback(async (inspectionId: string, type: string, notes?: string) => {
    if (!user) throw new Error('No user found');

    const fixedData = {
      isFixed: true,
      fixedBy: user.name,
      fixedAt: new Date().toISOString(),
    };

    const fixLog: FixLog = {
      id: Date.now().toString(),
      inspectionId,
      inspectionType: type as any,
      fixedBy: user.name,
      fixedAt: new Date().toISOString(),
      notes,
    };

    let updated: any[] = [];

    if (type === 'plant') {
      updated = plantInspections.map(i => 
        i.id === inspectionId ? { ...i, ...fixedData } : i
      );
      console.log('✅ Marking plant inspection as fixed:', inspectionId, fixedData);
      setPlantInspections(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.PLANT_INSPECTIONS, JSON.stringify(updated));
      console.log('✅ Plant inspection saved to storage');
    } else if (type === 'quickhitch') {
      updated = quickHitchInspections.map(i => 
        i.id === inspectionId ? { ...i, ...fixedData } : i
      );
      console.log('✅ Marking quickhitch inspection as fixed:', inspectionId, fixedData);
      setQuickHitchInspections(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.QUICK_HITCH_INSPECTIONS, JSON.stringify(updated));
      console.log('✅ Quickhitch inspection saved to storage');
    } else if (type === 'vehicle') {
      updated = vehicleInspections.map(i => 
        i.id === inspectionId ? { ...i, ...fixedData } : i
      );
      console.log('✅ Marking vehicle inspection as fixed:', inspectionId, fixedData);
      setVehicleInspections(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.VEHICLE_INSPECTIONS, JSON.stringify(updated));
      console.log('✅ Vehicle inspection saved to storage');
    } else if (type === 'bucketchange') {
      updated = bucketChangeInspections.map(i => 
        i.id === inspectionId ? { ...i, ...fixedData } : i
      );
      console.log('✅ Marking bucket change inspection as fixed:', inspectionId, fixedData);
      setBucketChangeInspections(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.BUCKET_CHANGE_INSPECTIONS, JSON.stringify(updated));
      console.log('✅ Bucket change inspection saved to storage');
    }

    const updatedFixLogs = [...fixLogs, fixLog];
    setFixLogs(updatedFixLogs);
    await AsyncStorage.setItem(STORAGE_KEYS.FIX_LOGS, JSON.stringify(updatedFixLogs));

    const updatedNotifications = notifications.map(n =>
      n.inspectionId === inspectionId
        ? {
            ...n,
            isCompleted: true,
            completedBy: user.name,
            completedAt: new Date().toISOString(),
          }
        : n
    );
    setNotifications(updatedNotifications);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));

    console.log(`✅ Inspection ${inspectionId} of type ${type} marked as fixed by ${user.name}`);
  }, [user, plantInspections, quickHitchInspections, vehicleInspections, bucketChangeInspections, notifications, fixLogs]);

  const submitPositiveIntervention = useCallback(async (intervention: Omit<PositiveIntervention, 'id' | 'createdAt'>) => {
    const newIntervention: PositiveIntervention = {
      ...intervention,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...positiveInterventions, newIntervention];
    await AsyncStorage.setItem(STORAGE_KEYS.POSITIVE_INTERVENTIONS, JSON.stringify(updated));
    setPositiveInterventions(updated);

    return newIntervention;
  }, [positiveInterventions]);

  const getCompanyPositiveInterventions = useCallback(() => {
    if (!company) return [];
    return positiveInterventions.filter(i => i.companyId === company.id);
  }, [company, positiveInterventions]);

  const getEmployeePositiveInterventions = useCallback((employeeId: string) => {
    return positiveInterventions.filter(i => i.employeeId === employeeId);
  }, [positiveInterventions]);

  const getFixLogs = useCallback(() => {
    return fixLogs;
  }, [fixLogs]);

  const submitApprenticeshipEntry = useCallback(async (entry: Omit<ApprenticeshipEntry, 'id' | 'createdAt'>) => {
    const newEntry: ApprenticeshipEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...apprenticeshipEntries, newEntry];
    await AsyncStorage.setItem(STORAGE_KEYS.APPRENTICESHIP_ENTRIES, JSON.stringify(updated));
    setApprenticeshipEntries(updated);

    return newEntry;
  }, [apprenticeshipEntries]);

  const getCompanyApprenticeshipEntries = useCallback(() => {
    if (!company) return [];
    return apprenticeshipEntries.filter(e => e.companyId === company.id);
  }, [company, apprenticeshipEntries]);

  const getApprenticeApprenticeshipEntries = useCallback((apprenticeId: string) => {
    return apprenticeshipEntries.filter(e => e.apprenticeId === apprenticeId);
  }, [apprenticeshipEntries]);

  const createAnnouncement = useCallback(async (title: string, message: string, priority: 'low' | 'normal' | 'high', autoDeleteDays?: number) => {
    if (!user || !company) throw new Error('No user or company found');

    let autoDeleteDate: string | undefined;
    if (autoDeleteDays && autoDeleteDays > 0) {
      const deleteDate = new Date();
      deleteDate.setDate(deleteDate.getDate() + autoDeleteDays);
      autoDeleteDate = deleteDate.toISOString();
    }

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      companyId: company.id,
      authorId: user.id,
      authorName: user.name,
      title,
      message,
      priority,
      autoDeleteDate,
      createdAt: new Date().toISOString(),
    };

    const updated = [...announcements, newAnnouncement];
    await AsyncStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));
    setAnnouncements(updated);

    return newAnnouncement;
  }, [user, company, announcements]);

  const getCompanyAnnouncements = useCallback(() => {
    if (!company) return [];
    const now = new Date();
    return announcements
      .filter(a => {
        if (a.companyId !== company.id) return false;
        if (a.autoDeleteDate && new Date(a.autoDeleteDate) <= now) {
          deleteAnnouncement(a.id).catch(console.error);
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [company, announcements]);

  const deleteAnnouncement = useCallback(async (announcementId: string) => {
    const updated = announcements.filter(a => a.id !== announcementId);
    await AsyncStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));
    setAnnouncements(updated);
  }, [announcements]);

  const updateCompanyLogo = useCallback(async (logoUri?: string) => {
    if (!company) throw new Error('No company found');

    const updatedCompany = {
      ...company,
      logo: logoUri,
    };

    const updatedCompanies = companies.map(c => 
      c.id === company.id ? updatedCompany : c
    );

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(updatedCompany)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updatedCompanies)),
    ]);

    setCompany(updatedCompany);
    setCompanies(updatedCompanies);
  }, [company, companies]);

  const saveDraft = useCallback(async (type: DraftType, data: any, draftId?: string, isWeeklyReport?: boolean) => {
    if (!user || !company) throw new Error('No user or company found');

    const existingDraft = draftId ? drafts.find(d => d.id === draftId) : null;
    
    const draft: Draft = {
      id: existingDraft?.id || Date.now().toString(),
      type,
      companyId: company.id,
      employeeId: user.id,
      employeeName: user.name,
      data,
      isWeeklyReport: isWeeklyReport !== undefined ? isWeeklyReport : existingDraft?.isWeeklyReport || false,
      createdAt: existingDraft?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = existingDraft 
      ? drafts.map(d => d.id === draftId ? draft : d)
      : [...drafts, draft];

    await AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(updated));
    setDrafts(updated);

    return draft;
  }, [user, company, drafts]);

  const getDrafts = useCallback((employeeId?: string) => {
    if (employeeId) {
      return drafts.filter(d => d.employeeId === employeeId);
    }
    if (!company) return [];
    return drafts.filter(d => d.companyId === company.id);
  }, [drafts, company]);

  const addGreasingRecord = useCallback(async (record: Omit<GreasingRecord, 'id' | 'createdAt'>) => {
    const newRecord: GreasingRecord = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...greasingRecords, newRecord];
    await AsyncStorage.setItem(STORAGE_KEYS.GREASING_RECORDS, JSON.stringify(updated));
    setGreasingRecords(updated);

    return newRecord;
  }, [greasingRecords]);

  const getEquipmentGreasingRecords = useCallback((equipmentId: string) => {
    return greasingRecords
      .filter(r => r.equipmentId === equipmentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [greasingRecords]);

  const deleteGreasingRecord = useCallback(async (recordId: string) => {
    const updated = greasingRecords.filter(r => r.id !== recordId);
    await AsyncStorage.setItem(STORAGE_KEYS.GREASING_RECORDS, JSON.stringify(updated));
    setGreasingRecords(updated);
  }, [greasingRecords]);

  const submitGreasingInspection = useCallback(async (inspection: Omit<GreasingInspection, 'id' | 'createdAt'>) => {
    const newInspection: GreasingInspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...greasingInspections, newInspection];
    await AsyncStorage.setItem(STORAGE_KEYS.GREASING_INSPECTIONS, JSON.stringify(updated));
    setGreasingInspections(updated);

    return newInspection;
  }, [greasingInspections]);

  const getCompanyGreasingInspections = useCallback(() => {
    if (!company) return [];
    return greasingInspections.filter(i => i.companyId === company.id);
  }, [company, greasingInspections]);

  const deleteGreasingInspection = useCallback(async (inspectionId: string) => {
    const updated = greasingInspections.filter(i => i.id !== inspectionId);
    await AsyncStorage.setItem(STORAGE_KEYS.GREASING_INSPECTIONS, JSON.stringify(updated));
    setGreasingInspections(updated);
  }, [greasingInspections]);

  const deleteDraft = useCallback(async (draftId: string) => {
    const updated = drafts.filter(d => d.id !== draftId);
    await AsyncStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(updated));
    setDrafts(updated);
  }, [drafts]);

  const submitDraft = useCallback(async (draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    if (!draft) throw new Error('Draft not found');

    let result;

    switch (draft.type) {
      case 'plant':
        result = await submitPlantInspection(draft.data as any);
        break;
      case 'quickhitch':
        result = await submitQuickHitchInspection(draft.data as any);
        break;
      case 'vehicle':
        result = await submitVehicleInspection(draft.data as any);
        break;
      case 'bucketchange':
        result = await submitBucketChangeInspection(draft.data as any);
        break;
      case 'intervention':
        result = await submitPositiveIntervention(draft.data as any);
        break;
      case 'greasing':
        result = await submitGreasingInspection(draft.data as any);
        break;
      default:
        throw new Error('Invalid draft type');
    }

    await deleteDraft(draftId);
    return result;
  }, [drafts, submitPlantInspection, submitQuickHitchInspection, submitVehicleInspection, submitBucketChangeInspection, submitPositiveIntervention, submitGreasingInspection, deleteDraft]);

  const addTicket = useCallback(async (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTicket: Ticket = {
      ...ticket,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...tickets, newTicket];
    await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
    setTickets(updated);

    if (ticket.reminderEnabled && ticket.reminderDate) {
      const reminder: TicketReminder = {
        id: Date.now().toString() + '_reminder',
        ticketId: newTicket.id,
        ticketTitle: newTicket.title,
        employeeId: newTicket.employeeId,
        reminderDate: ticket.reminderDate,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      };
      const updatedReminders = [...ticketReminders, reminder];
      await AsyncStorage.setItem(STORAGE_KEYS.TICKET_REMINDERS, JSON.stringify(updatedReminders));
      setTicketReminders(updatedReminders);
    }

    return newTicket;
  }, [tickets, ticketReminders]);

  const updateTicket = useCallback(async (ticketId: string, updates: Partial<Ticket>) => {
    const updated = tickets.map(t => 
      t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
    setTickets(updated);
  }, [tickets]);

  const deleteTicket = useCallback(async (ticketId: string) => {
    const updated = tickets.filter(t => t.id !== ticketId);
    await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
    setTickets(updated);

    const updatedReminders = ticketReminders.filter(r => r.ticketId !== ticketId);
    await AsyncStorage.setItem(STORAGE_KEYS.TICKET_REMINDERS, JSON.stringify(updatedReminders));
    setTicketReminders(updatedReminders);
  }, [tickets, ticketReminders]);

  const getEmployeeTickets = useCallback((employeeId: string) => {
    return tickets.filter(t => t.employeeId === employeeId);
  }, [tickets]);

  const getEmployeeReminders = useCallback((employeeId: string) => {
    return ticketReminders
      .filter(r => r.employeeId === employeeId && !r.isCompleted)
      .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
  }, [ticketReminders]);

  const markReminderCompleted = useCallback(async (reminderId: string) => {
    const updated = ticketReminders.map(r => 
      r.id === reminderId ? { ...r, isCompleted: true } : r
    );
    await AsyncStorage.setItem(STORAGE_KEYS.TICKET_REMINDERS, JSON.stringify(updated));
    setTicketReminders(updated);
  }, [ticketReminders]);

  const submitAirTestingInspection = useCallback(async (inspection: Omit<AirTestingInspection, 'id' | 'createdAt'>) => {
    const newInspection: AirTestingInspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...airTestingInspections, newInspection];
    await AsyncStorage.setItem(STORAGE_KEYS.AIR_TESTING_INSPECTIONS, JSON.stringify(updated));
    setAirTestingInspections(updated);

    return newInspection;
  }, [airTestingInspections]);

  const getCompanyAirTestingInspections = useCallback(() => {
    if (!company) return [];
    return airTestingInspections.filter(i => i.companyId === company.id);
  }, [company, airTestingInspections]);

  const deleteAirTestingInspection = useCallback(async (inspectionId: string) => {
    const updated = airTestingInspections.filter(i => i.id !== inspectionId);
    await AsyncStorage.setItem(STORAGE_KEYS.AIR_TESTING_INSPECTIONS, JSON.stringify(updated));
    setAirTestingInspections(updated);
  }, [airTestingInspections]);

  const addEquipmentCategory = useCallback(async (name: string, parentCategoryId?: string) => {
    if (!company) throw new Error('No company found');

    const newCategory: EquipmentCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      parentCategoryId,
      companyId: company.id,
      createdAt: new Date().toISOString(),
    };

    const updated = [...equipmentCategories, newCategory];
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_CATEGORIES, JSON.stringify(updated));
    setEquipmentCategories(updated);

    return newCategory;
  }, [company, equipmentCategories]);

  const updateEquipmentCategory = useCallback(async (categoryId: string, name: string) => {
    const updated = equipmentCategories.map(c => 
      c.id === categoryId ? { ...c, name: name.trim() } : c
    );
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_CATEGORIES, JSON.stringify(updated));
    setEquipmentCategories(updated);
  }, [equipmentCategories]);

  const deleteEquipmentCategory = useCallback(async (categoryId: string) => {
    const categoryItems = equipmentItems.filter(i => i.categoryId === categoryId);
    if (categoryItems.length > 0) {
      throw new Error('Cannot delete category with items. Please delete all items first.');
    }

    const updated = equipmentCategories.filter(c => c.id !== categoryId);
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_CATEGORIES, JSON.stringify(updated));
    setEquipmentCategories(updated);
  }, [equipmentCategories, equipmentItems]);

  const getCompanyEquipmentCategories = useCallback(() => {
    if (!company) return [];
    return equipmentCategories.filter(c => c.companyId === company.id);
  }, [company, equipmentCategories]);

  const addEquipmentItem = useCallback(async (item: Omit<EquipmentItem, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    if (!company) throw new Error('No company found');

    const newItem: EquipmentItem = {
      ...item,
      id: Date.now().toString(),
      companyId: company.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...equipmentItems, newItem];
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, JSON.stringify(updated));
    setEquipmentItems(updated);

    return newItem;
  }, [company, equipmentItems]);

  const updateEquipmentItem = useCallback(async (itemId: string, updates: Partial<EquipmentItem>) => {
    const updated = equipmentItems.map(i => 
      i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
    );
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, JSON.stringify(updated));
    setEquipmentItems(updated);
  }, [equipmentItems]);

  const deleteEquipmentItem = useCallback(async (itemId: string) => {
    const updated = equipmentItems.filter(i => i.id !== itemId);
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, JSON.stringify(updated));
    setEquipmentItems(updated);
  }, [equipmentItems]);

  const getCompanyEquipmentItems = useCallback(() => {
    if (!company) return [];
    return equipmentItems.filter(i => i.companyId === company.id);
  }, [company, equipmentItems]);

  const getCategoryEquipmentItems = useCallback((categoryId: string) => {
    return equipmentItems.filter(i => i.categoryId === categoryId);
  }, [equipmentItems]);

  const addEquipmentCertificate = useCallback(async (itemId: string, certificate: Omit<EquipmentCertificate, 'id' | 'equipmentItemId' | 'uploadedBy' | 'uploadedAt'>) => {
    if (!user) throw new Error('No user found');

    const newCertificate: EquipmentCertificate = {
      ...certificate,
      id: Date.now().toString(),
      equipmentItemId: itemId,
      uploadedBy: user.name,
      uploadedAt: new Date().toISOString(),
    };

    const updated = equipmentItems.map(i => 
      i.id === itemId 
        ? { ...i, certificates: [...i.certificates, newCertificate], updatedAt: new Date().toISOString() }
        : i
    );

    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, JSON.stringify(updated));
    setEquipmentItems(updated);

    return newCertificate;
  }, [user, equipmentItems]);

  const deleteEquipmentCertificate = useCallback(async (itemId: string, certificateId: string) => {
    const updated = equipmentItems.map(i => 
      i.id === itemId 
        ? { ...i, certificates: i.certificates.filter(c => c.id !== certificateId), updatedAt: new Date().toISOString() }
        : i
    );

    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_ITEMS, JSON.stringify(updated));
    setEquipmentItems(updated);
  }, [equipmentItems]);

  const submitHolidayRequest = useCallback(async (startDate: string, endDate: string, reason?: string) => {
    if (!user || !company) throw new Error('No user or company found');

    const newRequest: HolidayRequest = {
      id: Date.now().toString(),
      companyId: company.id,
      employeeId: user.id,
      employeeName: user.name,
      startDate,
      endDate,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [...holidayRequests, newRequest];
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_REQUESTS, JSON.stringify(updated));
    setHolidayRequests(updated);

    const notification: HolidayNotification = {
      id: Date.now().toString() + '_notif',
      companyId: company.id,
      requestId: newRequest.id,
      employeeId: user.id,
      employeeName: user.name,
      message: `${user.name} has requested holiday from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
      type: 'request',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedNotifications = [...holidayNotifications, notification];
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS, JSON.stringify(updatedNotifications));
    setHolidayNotifications(updatedNotifications);

    return newRequest;
  }, [user, company, holidayRequests, holidayNotifications]);

  const getEmployeeHolidayRequests = useCallback((employeeId: string) => {
    return holidayRequests
      .filter(r => r.employeeId === employeeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [holidayRequests]);

  const getCompanyHolidayRequests = useCallback(() => {
    if (!company) return [];
    return holidayRequests
      .filter(r => r.companyId === company.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [company, holidayRequests]);

  const approveHolidayRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error('No user found');

    const request = holidayRequests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const updated = holidayRequests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'approved' as HolidayStatus, reviewedBy: user.name, reviewedAt: new Date().toISOString() }
        : r
    );
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_REQUESTS, JSON.stringify(updated));
    setHolidayRequests(updated);

    const notification: HolidayNotification = {
      id: Date.now().toString() + '_notif',
      companyId: request.companyId,
      requestId: request.id,
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      message: `Your holiday request from ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()} has been approved by ${user.name}`,
      type: 'approved',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedNotifications = [...holidayNotifications, notification];
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS, JSON.stringify(updatedNotifications));
    setHolidayNotifications(updatedNotifications);
  }, [user, holidayRequests, holidayNotifications]);

  const rejectHolidayRequest = useCallback(async (requestId: string) => {
    if (!user) throw new Error('No user found');

    const request = holidayRequests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');

    const updated = holidayRequests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'rejected' as HolidayStatus, reviewedBy: user.name, reviewedAt: new Date().toISOString() }
        : r
    );
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_REQUESTS, JSON.stringify(updated));
    setHolidayRequests(updated);

    const notification: HolidayNotification = {
      id: Date.now().toString() + '_notif',
      companyId: request.companyId,
      requestId: request.id,
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      message: `Your holiday request from ${new Date(request.startDate).toLocaleDateString()} to ${new Date(request.endDate).toLocaleDateString()} has been declined by ${user.name}`,
      type: 'rejected',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedNotifications = [...holidayNotifications, notification];
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS, JSON.stringify(updatedNotifications));
    setHolidayNotifications(updatedNotifications);
  }, [user, holidayRequests, holidayNotifications]);

  const getEmployeeHolidayNotifications = useCallback((employeeId: string) => {
    return holidayNotifications
      .filter(n => n.employeeId === employeeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [holidayNotifications]);

  const getCompanyHolidayNotifications = useCallback(() => {
    if (!company) return [];
    return holidayNotifications
      .filter(n => n.companyId === company.id && n.type === 'request')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [company, holidayNotifications]);

  const markHolidayNotificationRead = useCallback(async (notificationId: string) => {
    const updated = holidayNotifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS, JSON.stringify(updated));
    setHolidayNotifications(updated);
  }, [holidayNotifications]);

  const deleteHolidayRequest = useCallback(async (requestId: string) => {
    const updated = holidayRequests.filter(r => r.id !== requestId);
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_REQUESTS, JSON.stringify(updated));
    setHolidayRequests(updated);

    const updatedNotifications = holidayNotifications.filter(n => n.requestId !== requestId);
    await AsyncStorage.setItem(STORAGE_KEYS.HOLIDAY_NOTIFICATIONS, JSON.stringify(updatedNotifications));
    setHolidayNotifications(updatedNotifications);
  }, [holidayRequests, holidayNotifications]);

  const addPlantCategory = useCallback(async (name: string, parentCategoryId?: string) => {
    if (!company) throw new Error('No company found');

    const newCategory: PlantCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      parentCategoryId,
      companyId: company.id,
      createdAt: new Date().toISOString(),
    };

    const updated = [...plantCategories, newCategory];
    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_CATEGORIES, JSON.stringify(updated));
    setPlantCategories(updated);

    return newCategory;
  }, [company, plantCategories]);

  const updatePlantCategory = useCallback(async (categoryId: string, name: string) => {
    const updated = plantCategories.map(c => 
      c.id === categoryId ? { ...c, name: name.trim() } : c
    );
    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_CATEGORIES, JSON.stringify(updated));
    setPlantCategories(updated);
  }, [plantCategories]);

  const deletePlantCategory = useCallback(async (categoryId: string) => {
    const categoryItems = plantItems.filter(i => i.categoryId === categoryId);
    if (categoryItems.length > 0) {
      throw new Error('Cannot delete category with items. Please delete all items first.');
    }

    const updated = plantCategories.filter(c => c.id !== categoryId);
    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_CATEGORIES, JSON.stringify(updated));
    setPlantCategories(updated);
  }, [plantCategories, plantItems]);

  const getCompanyPlantCategories = useCallback(() => {
    if (!company) return [];
    return plantCategories.filter(c => c.companyId === company.id);
  }, [company, plantCategories]);

  const addPlantItem = useCallback(async (item: Omit<PlantItem, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
    if (!company) throw new Error('No company found');

    const newItem: PlantItem = {
      ...item,
      id: Date.now().toString(),
      companyId: company.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...plantItems, newItem];
    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_ITEMS, JSON.stringify(updated));
    setPlantItems(updated);

    return newItem;
  }, [company, plantItems]);

  const updatePlantItem = useCallback(async (itemId: string, updates: Partial<PlantItem>) => {
    const updated = plantItems.map(i => 
      i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
    );
    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_ITEMS, JSON.stringify(updated));
    setPlantItems(updated);
  }, [plantItems]);

  const deletePlantItem = useCallback(async (itemId: string) => {
    const updated = plantItems.filter(i => i.id !== itemId);
    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_ITEMS, JSON.stringify(updated));
    setPlantItems(updated);
  }, [plantItems]);

  const getCompanyPlantItems = useCallback(() => {
    if (!company) return [];
    return plantItems.filter(i => i.companyId === company.id);
  }, [company, plantItems]);

  const getCategoryPlantItems = useCallback((categoryId: string) => {
    return plantItems.filter(i => i.categoryId === categoryId);
  }, [plantItems]);

  const addPlantCertificate = useCallback(async (itemId: string, certificate: Omit<PlantCertificate, 'id' | 'plantItemId' | 'uploadedBy' | 'uploadedAt'>) => {
    if (!user) throw new Error('No user found');

    const newCertificate: PlantCertificate = {
      ...certificate,
      id: Date.now().toString(),
      plantItemId: itemId,
      uploadedBy: user.name,
      uploadedAt: new Date().toISOString(),
    };

    const updated = plantItems.map(i => 
      i.id === itemId 
        ? { ...i, certificates: [...i.certificates, newCertificate], updatedAt: new Date().toISOString() }
        : i
    );

    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_ITEMS, JSON.stringify(updated));
    setPlantItems(updated);

    return newCertificate;
  }, [user, plantItems]);

  const deletePlantCertificate = useCallback(async (itemId: string, certificateId: string) => {
    const updated = plantItems.map(i => 
      i.id === itemId 
        ? { ...i, certificates: i.certificates.filter(c => c.id !== certificateId), updatedAt: new Date().toISOString() }
        : i
    );

    await AsyncStorage.setItem(STORAGE_KEYS.PLANT_ITEMS, JSON.stringify(updated));
    setPlantItems(updated);
  }, [plantItems]);

  const submitEquipmentReport = useCallback(async (report: Omit<EquipmentReport, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'actionLog'>) => {
    if (!user) throw new Error('No user found');

    const newReport: EquipmentReport = {
      ...report,
      id: Date.now().toString(),
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actionLog: [
        {
          id: Date.now().toString(),
          action: 'created',
          performedBy: user.name,
          performedAt: new Date().toISOString(),
        },
      ],
    };

    const updated = [...equipmentReports, newReport];
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_REPORTS, JSON.stringify(updated));
    setEquipmentReports(updated);

    return newReport;
  }, [user, equipmentReports]);

  const getCompanyEquipmentReports = useCallback(() => {
    if (!company) return [];
    return equipmentReports
      .filter(r => r.companyId === company.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [company, equipmentReports]);

  const markEquipmentReportFixed = useCallback(async (reportId: string, fixNotes?: string) => {
    if (!user) throw new Error('No user found');

    const updated = equipmentReports.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'fixed' as const,
          fixedBy: user.name,
          fixedAt: new Date().toISOString(),
          fixNotes,
          updatedAt: new Date().toISOString(),
          actionLog: [
            ...r.actionLog,
            {
              id: Date.now().toString(),
              action: 'fixed' as const,
              performedBy: user.name,
              performedAt: new Date().toISOString(),
              notes: fixNotes,
            },
          ],
        };
      }
      return r;
    });

    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_REPORTS, JSON.stringify(updated));
    setEquipmentReports(updated);
  }, [user, equipmentReports]);

  const markEquipmentReportDiscarded = useCallback(async (reportId: string, discardNotes?: string) => {
    if (!user) throw new Error('No user found');

    const updated = equipmentReports.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status: 'discarded' as const,
          discardedBy: user.name,
          discardedAt: new Date().toISOString(),
          discardNotes,
          updatedAt: new Date().toISOString(),
          actionLog: [
            ...r.actionLog,
            {
              id: Date.now().toString(),
              action: 'discarded' as const,
              performedBy: user.name,
              performedAt: new Date().toISOString(),
              notes: discardNotes,
            },
          ],
        };
      }
      return r;
    });

    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_REPORTS, JSON.stringify(updated));
    setEquipmentReports(updated);
  }, [user, equipmentReports]);

  const deleteEquipmentReport = useCallback(async (reportId: string) => {
    const updated = equipmentReports.filter(r => r.id !== reportId);
    await AsyncStorage.setItem(STORAGE_KEYS.EQUIPMENT_REPORTS, JSON.stringify(updated));
    setEquipmentReports(updated);
  }, [equipmentReports]);

  return useMemo(() => ({
    user,
    company,
    companies,
    plantInspections,
    quickHitchInspections,
    vehicleInspections,
    bucketChangeInspections,
    notifications,
    positiveInterventions,
    fixLogs,
    apprenticeshipEntries,
    announcements,
    drafts,
    greasingRecords,
    greasingInspections,
    tickets,
    ticketReminders,
    airTestingInspections,
    equipmentCategories,
    equipmentItems,
    holidayRequests,
    holidayNotifications,
    plantCategories,
    plantItems,
    equipmentReports,
    isLoading,
    registerCompany,
    joinCompany,
    login,
    submitPlantInspection,
    submitQuickHitchInspection,
    submitVehicleInspection,
    submitBucketChangeInspection,
    submitPositiveIntervention,
    logout,
    getCompanyInspections,
    getEmployeeInspections,
    getCompanyPositiveInterventions,
    getEmployeePositiveInterventions,
    getFixLogs,
    addProject,
    updateProject,
    deleteProject,
    getCompanyUsers,
    changeUserRole,
    removeEmployee,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    switchCompany,
    getUserCompanies,
    updateUserProfile,
    getCompanyNotifications,
    markNotificationComplete,
    deleteNotification,
    deleteInspection,
    markInspectionFixed,
    submitApprenticeshipEntry,
    getCompanyApprenticeshipEntries,
    getApprenticeApprenticeshipEntries,
    createAnnouncement,
    getCompanyAnnouncements,
    deleteAnnouncement,
    updateCompanyLogo,
    saveDraft,
    getDrafts,
    deleteDraft,
    submitDraft,
    addGreasingRecord,
    getEquipmentGreasingRecords,
    deleteGreasingRecord,
    submitGreasingInspection,
    getCompanyGreasingInspections,
    deleteGreasingInspection,
    addTicket,
    updateTicket,
    deleteTicket,
    getEmployeeTickets,
    getEmployeeReminders,
    markReminderCompleted,
    submitAirTestingInspection,
    getCompanyAirTestingInspections,
    deleteAirTestingInspection,
    addEquipmentCategory,
    updateEquipmentCategory,
    deleteEquipmentCategory,
    getCompanyEquipmentCategories,
    addEquipmentItem,
    updateEquipmentItem,
    deleteEquipmentItem,
    getCompanyEquipmentItems,
    getCategoryEquipmentItems,
    addEquipmentCertificate,
    deleteEquipmentCertificate,
    submitHolidayRequest,
    getEmployeeHolidayRequests,
    getCompanyHolidayRequests,
    approveHolidayRequest,
    rejectHolidayRequest,
    getEmployeeHolidayNotifications,
    getCompanyHolidayNotifications,
    markHolidayNotificationRead,
    deleteHolidayRequest,
    addPlantCategory,
    updatePlantCategory,
    deletePlantCategory,
    getCompanyPlantCategories,
    addPlantItem,
    updatePlantItem,
    deletePlantItem,
    getCompanyPlantItems,
    getCategoryPlantItems,
    addPlantCertificate,
    deletePlantCertificate,
    submitEquipmentReport,
    getCompanyEquipmentReports,
    markEquipmentReportFixed,
    markEquipmentReportDiscarded,
    deleteEquipmentReport,
  }), [user, company, companies, plantInspections, quickHitchInspections, vehicleInspections, bucketChangeInspections, notifications, positiveInterventions, fixLogs, apprenticeshipEntries, announcements, drafts, greasingRecords, greasingInspections, tickets, ticketReminders, airTestingInspections, equipmentCategories, equipmentItems, holidayRequests, holidayNotifications, plantCategories, plantItems, equipmentReports, isLoading, registerCompany, joinCompany, login, submitPlantInspection, submitQuickHitchInspection, submitVehicleInspection, submitBucketChangeInspection, submitPositiveIntervention, logout, getCompanyInspections, getEmployeeInspections, getCompanyPositiveInterventions, getEmployeePositiveInterventions, getFixLogs, addProject, updateProject, deleteProject, getCompanyUsers, changeUserRole, removeEmployee, addEquipment, updateEquipment, deleteEquipment, switchCompany, getUserCompanies, updateUserProfile, getCompanyNotifications, markNotificationComplete, deleteNotification, deleteInspection, markInspectionFixed, submitApprenticeshipEntry, getCompanyApprenticeshipEntries, getApprenticeApprenticeshipEntries, createAnnouncement, getCompanyAnnouncements, deleteAnnouncement, updateCompanyLogo, saveDraft, getDrafts, deleteDraft, submitDraft, addGreasingRecord, getEquipmentGreasingRecords, deleteGreasingRecord, submitGreasingInspection, getCompanyGreasingInspections, deleteGreasingInspection, addTicket, updateTicket, deleteTicket, getEmployeeTickets, getEmployeeReminders, markReminderCompleted, submitAirTestingInspection, getCompanyAirTestingInspections, deleteAirTestingInspection, addEquipmentCategory, updateEquipmentCategory, deleteEquipmentCategory, getCompanyEquipmentCategories, addEquipmentItem, updateEquipmentItem, deleteEquipmentItem, getCompanyEquipmentItems, getCategoryEquipmentItems, addEquipmentCertificate, deleteEquipmentCertificate, submitHolidayRequest, getEmployeeHolidayRequests, getCompanyHolidayRequests, approveHolidayRequest, rejectHolidayRequest, getEmployeeHolidayNotifications, getCompanyHolidayNotifications, markHolidayNotificationRead, deleteHolidayRequest, addPlantCategory, updatePlantCategory, deletePlantCategory, getCompanyPlantCategories, addPlantItem, updatePlantItem, deletePlantItem, getCompanyPlantItems, getCategoryPlantItems, addPlantCertificate, deletePlantCertificate, submitEquipmentReport, getCompanyEquipmentReports, markEquipmentReportFixed, markEquipmentReportDiscarded, deleteEquipmentReport]);
});
