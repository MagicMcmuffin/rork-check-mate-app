import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { User, Company, PlantInspection, QuickHitchInspection, VehicleInspection, BucketChangeInspection, Project, Equipment, Notification, PositiveIntervention, FixLog, ApprenticeshipEntry, Announcement } from '@/types';
import { PLANT_INSPECTION_ITEMS, PLANT_INSPECTION_SECONDARY_ITEMS, QUICK_HITCH_ITEMS, VEHICLE_INSPECTION_ITEMS, BUCKET_CHANGE_ITEMS } from '@/constants/inspections';
import { trpcClient } from '@/lib/trpc';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, companyData, companiesData, usersData, plantData, quickHitchData, vehicleData, bucketData, notificationsData, positiveInterventionsData, fixLogsData, apprenticeshipData, announcementsData] = await Promise.all([
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
      ]);

      const safeJSONParse = (data: string | null, key: string) => {
        if (!data) return null;
        try {
          return JSON.parse(data);
        } catch (error) {
          console.error(`Error parsing ${key}:`, error);
          console.error(`Invalid data for ${key}:`, data.substring(0, 100));
          return null;
        }
      };

      const parsedUser = safeJSONParse(userData, 'USER');
      if (parsedUser) setUser(parsedUser);

      const parsedCompany = safeJSONParse(companyData, 'COMPANY');
      if (parsedCompany) {
        setCompany({
          ...parsedCompany,
          projects: parsedCompany.projects || [],
          equipment: parsedCompany.equipment || [],
        });
      }

      const parsedCompanies = safeJSONParse(companiesData, 'COMPANIES');
      if (parsedCompanies) setCompanies(parsedCompanies);

      const parsedUsers = safeJSONParse(usersData, 'USERS');
      if (parsedUsers) setUsers(parsedUsers);

      const parsedPlant = safeJSONParse(plantData, 'PLANT_INSPECTIONS');
      if (parsedPlant) setPlantInspections(parsedPlant);

      const parsedQuickHitch = safeJSONParse(quickHitchData, 'QUICK_HITCH_INSPECTIONS');
      if (parsedQuickHitch) setQuickHitchInspections(parsedQuickHitch);

      const parsedVehicle = safeJSONParse(vehicleData, 'VEHICLE_INSPECTIONS');
      if (parsedVehicle) setVehicleInspections(parsedVehicle);

      const parsedBucket = safeJSONParse(bucketData, 'BUCKET_CHANGE_INSPECTIONS');
      if (parsedBucket) setBucketChangeInspections(parsedBucket);

      const parsedNotifications = safeJSONParse(notificationsData, 'NOTIFICATIONS');
      if (parsedNotifications) setNotifications(parsedNotifications);

      const parsedInterventions = safeJSONParse(positiveInterventionsData, 'POSITIVE_INTERVENTIONS');
      if (parsedInterventions) setPositiveInterventions(parsedInterventions);

      const parsedFixLogs = safeJSONParse(fixLogsData, 'FIX_LOGS');
      if (parsedFixLogs) setFixLogs(parsedFixLogs);

      const parsedApprenticeshipEntries = safeJSONParse(apprenticeshipData, 'APPRENTICESHIP_ENTRIES');
      if (parsedApprenticeshipEntries) setApprenticeshipEntries(parsedApprenticeshipEntries);

      const parsedAnnouncements = safeJSONParse(announcementsData, 'ANNOUNCEMENTS');
      if (parsedAnnouncements) setAnnouncements(parsedAnnouncements);
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

  const registerCompany = useCallback(async (name: string, email: string, password: string, profilePicture?: string) => {
    const code = generateCompanyCode();
    const newCompany: Company = {
      id: Date.now().toString(),
      name,
      code,
      email,
      projects: [],
      equipment: [],
      createdAt: new Date().toISOString(),
    };

    const newUser: User = {
      id: Date.now().toString(),
      role: 'company',
      companyId: newCompany.id,
      name,
      email,
      password,
      profilePicture,
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

    const existingUser = allUsers.find((u: User) => u.email === email);
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
    const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    const allUsers: User[] = usersData ? JSON.parse(usersData) : [];

    const foundUser = allUsers.find((u: User) => u.email === email && u.password === password);
    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    const companiesData = await AsyncStorage.getItem(STORAGE_KEYS.COMPANIES);
    const allCompanies: Company[] = companiesData ? JSON.parse(companiesData) : [];
    const foundCompany = allCompanies.find((c: Company) => c.id === foundUser.companyId);

    if (!foundCompany) {
      throw new Error('Company not found');
    }

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(foundUser)),
      AsyncStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(foundCompany)),
    ]);

    setUser(foundUser);
    setCompany(foundCompany);
    setUsers(allUsers);

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

    const project = inspection.projectId ? company?.projects?.find(p => p.id === inspection.projectId) : undefined;
    const adminUsers = users.filter(u => 
      u.companyId === company?.id && 
      (u.role === 'administrator' || u.role === 'management' || u.role === 'mechanic')
    );

    const allItems = [...PLANT_INSPECTION_ITEMS, ...PLANT_INSPECTION_SECONDARY_ITEMS];
    const failedCheckDetails = newInspection.checks
      .filter(c => c.status === 'B' || c.status === 'C')
      .map(check => {
        const item = allItems.find(i => i.id === check.itemId);
        return {
          name: item?.name || check.itemId,
          status: check.status || '',
          notes: check.notes,
        };
      });

    if (failedCheckDetails.length > 0 && company?.email) {
      try {
        await trpcClient.inspections.sendNotificationEmail.mutate({
          inspectionType: 'plant',
          equipmentName: company?.equipment?.find(e => e.id === inspection.equipmentId)?.name || `Plant #${inspection.plantNumber}`,
          operatorName: newInspection.employeeName,
          date: newInspection.date,
          projectName: project?.name,
          failedChecks: failedCheckDetails,
          notesOnDefects: newInspection.notesOnDefects,
          companyName: company?.name || 'Unknown Company',
          companyEmail: company?.email,
          projectEmails: project?.emails,
          adminEmails: adminUsers.map(u => u.email),
        });
        console.log('Plant inspection email sent successfully');
      } catch {
        console.log('Email notification simulated (dev mode)');
      }
    }

    return newInspection;
  }, [plantInspections, company, notifications, users]);

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

    const project = inspection.projectId ? company?.projects?.find(p => p.id === inspection.projectId) : undefined;
    const adminUsers = users.filter(u => 
      u.companyId === company?.id && 
      (u.role === 'administrator' || u.role === 'management' || u.role === 'mechanic')
    );

    const failedCheckDetails = newInspection.checks
      .filter(c => c.status === '✗' || c.status === false)
      .map(check => {
        const item = QUICK_HITCH_ITEMS.find(i => i.id === check.itemId);
        return {
          name: item?.name || check.itemId,
          status: typeof check.status === 'boolean' ? (check.status ? '✓' : '✗') : check.status?.toString() || '✗',
          notes: undefined,
        };
      });

    if (failedCheckDetails.length > 0 && company?.email) {
      try {
        await trpcClient.inspections.sendNotificationEmail.mutate({
          inspectionType: 'quickhitch',
          equipmentName: company?.equipment?.find(e => e.id === inspection.equipmentId)?.name || inspection.excavatorDetails,
          operatorName: newInspection.operatorName,
          date: newInspection.date,
          projectName: project?.name,
          failedChecks: failedCheckDetails,
          notesOnDefects: newInspection.remarks,
          companyName: company?.name || 'Unknown Company',
          companyEmail: company?.email,
          projectEmails: project?.emails,
          adminEmails: adminUsers.map(u => u.email),
        });
        console.log('Quick hitch inspection email sent successfully');
      } catch {
        console.log('Email notification simulated (dev mode)');
      }
    }

    return newInspection;
  }, [quickHitchInspections, company, notifications, users]);

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

    const adminUsers = users.filter(u => 
      u.companyId === company?.id && 
      (u.role === 'administrator' || u.role === 'management' || u.role === 'mechanic')
    );

    const failedCheckDetails = newInspection.checks
      .filter(c => c.status === 'B' || c.status === 'C')
      .map(check => {
        const item = VEHICLE_INSPECTION_ITEMS.find(i => i.id === check.itemId);
        return {
          name: item?.name || check.itemId,
          status: check.status || '',
          notes: check.notes,
        };
      });

    if (failedCheckDetails.length > 0 && company?.email) {
      try {
        await trpcClient.inspections.sendNotificationEmail.mutate({
          inspectionType: 'vehicle',
          equipmentName: company?.equipment?.find(e => e.id === inspection.equipmentId)?.name || inspection.vehicleRegistration,
          operatorName: newInspection.employeeName,
          date: newInspection.date,
          failedChecks: failedCheckDetails,
          notesOnDefects: newInspection.additionalComments,
          companyName: company?.name || 'Unknown Company',
          companyEmail: company?.email,
          adminEmails: adminUsers.map(u => u.email),
        });
        console.log('Vehicle inspection email sent successfully');
      } catch {
        console.log('Email notification simulated (dev mode)');
      }
    }

    return newInspection;
  }, [vehicleInspections, company, notifications, users]);

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

    const updatedCompany = {
      ...company,
      projects: [...(company.projects || []), newProject],
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

  const updateProject = useCallback(async (projectId: string, name: string, projectNumber: string, emails: string[]) => {
    if (!company) throw new Error('No company found');

    const updatedCompany = {
      ...company,
      projects: (company.projects || []).map(p => 
        p.id === projectId ? { ...p, name, projectNumber, emails } : p
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

  const changeUserRole = useCallback(async (userId: string, newRole: 'administrator' | 'management' | 'mechanic' | 'apprentice' | 'employee') => {
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

    const project = inspection.projectId ? company?.projects?.find(p => p.id === inspection.projectId) : undefined;
    const adminUsers = users.filter(u => 
      u.companyId === company?.id && 
      (u.role === 'administrator' || u.role === 'management' || u.role === 'mechanic')
    );

    const failedCheckDetails = newInspection.checks
      .filter(c => c.status === false)
      .map(check => {
        const item = BUCKET_CHANGE_ITEMS.find((i: { id: string; name: string }) => i.id === check.itemId);
        return {
          name: item?.name || check.itemId,
          status: 'Failed',
          notes: check.notes,
        };
      });

    if (failedCheckDetails.length > 0 && company?.email) {
      try {
        await trpcClient.inspections.sendNotificationEmail.mutate({
          inspectionType: 'bucket',
          equipmentName: company?.equipment?.find(e => e.id === inspection.equipmentId)?.name || inspection.bucketType,
          operatorName: newInspection.employeeName,
          date: newInspection.date,
          projectName: project?.name,
          failedChecks: failedCheckDetails,
          companyName: company?.name || 'Unknown Company',
          companyEmail: company?.email,
          projectEmails: project?.emails,
          adminEmails: adminUsers.map(u => u.email),
        });
        console.log('Bucket change inspection email sent successfully');
      } catch {
        console.log('Email notification simulated (dev mode)');
      }
    }

    return newInspection;
  }, [bucketChangeInspections, company, notifications, users]);

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
      setPlantInspections(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.PLANT_INSPECTIONS, JSON.stringify(updated));
    } else if (type === 'quickhitch') {
      updated = quickHitchInspections.map(i => 
        i.id === inspectionId ? { ...i, ...fixedData } : i
      );
      setQuickHitchInspections(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.QUICK_HITCH_INSPECTIONS, JSON.stringify(updated));
    } else if (type === 'vehicle') {
      updated = vehicleInspections.map(i => 
        i.id === inspectionId ? { ...i, ...fixedData } : i
      );
      setVehicleInspections(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.VEHICLE_INSPECTIONS, JSON.stringify(updated));
    } else if (type === 'bucketchange') {
      updated = bucketChangeInspections.map(i => 
        i.id === inspectionId ? { ...i, ...fixedData } : i
      );
      setBucketChangeInspections(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.BUCKET_CHANGE_INSPECTIONS, JSON.stringify(updated));
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

    console.log(`Inspection ${inspectionId} marked as fixed by ${user.name}`);
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

    const project = intervention.projectId ? company?.projects?.find(p => p.id === intervention.projectId) : undefined;
    const adminUsers = users.filter(u => 
      u.companyId === company?.id && 
      (u.role === 'administrator' || u.role === 'management')
    );

    if (company?.email) {
      try {
        await trpcClient.interventions.sendNotificationEmail.mutate({
          employeeName: newIntervention.employeeName,
          date: newIntervention.date,
          projectName: project?.name,
          hazardDescription: newIntervention.hazardDescription,
          severity: newIntervention.severity,
          actionTaken: newIntervention.actionTaken,
          site: newIntervention.site,
          location: newIntervention.location,
          companyName: company?.name || 'Unknown Company',
          companyEmail: company?.email,
          projectEmails: project?.emails,
          adminEmails: adminUsers.map(u => u.email),
        });
        console.log('Positive intervention email sent successfully');
      } catch {
        console.log('Email notification simulated (dev mode)');
      }
    }
    return newIntervention;
  }, [positiveInterventions, company, users]);

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

  const createAnnouncement = useCallback(async (title: string, message: string, priority: 'low' | 'normal' | 'high') => {
    if (!user || !company) throw new Error('No user or company found');

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      companyId: company.id,
      authorId: user.id,
      authorName: user.name,
      title,
      message,
      priority,
      createdAt: new Date().toISOString(),
    };

    const updated = [...announcements, newAnnouncement];
    await AsyncStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));
    setAnnouncements(updated);

    const companyUsers = users.filter(u => u.companyId === company.id && u.email);
    const recipientEmails = companyUsers.map(u => u.email).filter(Boolean) as string[];

    if (recipientEmails.length > 0 && company.email) {
      try {
        await trpcClient.announcements.sendNotificationEmail.mutate({
          companyName: company.name,
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          priority: newAnnouncement.priority,
          authorName: newAnnouncement.authorName,
          date: new Date(newAnnouncement.createdAt).toLocaleDateString(),
          recipientEmails,
        });
        console.log('Announcement email sent successfully');
      } catch {
        console.log('Email notification simulated (dev mode)');
      }
    }

    return newAnnouncement;
  }, [user, company, announcements, users]);

  const getCompanyAnnouncements = useCallback(() => {
    if (!company) return [];
    return announcements
      .filter(a => a.companyId === company.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [company, announcements]);

  const deleteAnnouncement = useCallback(async (announcementId: string) => {
    const updated = announcements.filter(a => a.id !== announcementId);
    await AsyncStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updated));
    setAnnouncements(updated);
  }, [announcements]);

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
  }), [user, company, companies, plantInspections, quickHitchInspections, vehicleInspections, bucketChangeInspections, notifications, positiveInterventions, fixLogs, apprenticeshipEntries, announcements, isLoading, registerCompany, joinCompany, login, submitPlantInspection, submitQuickHitchInspection, submitVehicleInspection, submitBucketChangeInspection, submitPositiveIntervention, logout, getCompanyInspections, getEmployeeInspections, getCompanyPositiveInterventions, getEmployeePositiveInterventions, getFixLogs, addProject, updateProject, deleteProject, getCompanyUsers, changeUserRole, removeEmployee, addEquipment, updateEquipment, deleteEquipment, switchCompany, getUserCompanies, updateUserProfile, getCompanyNotifications, markNotificationComplete, deleteNotification, deleteInspection, markInspectionFixed, submitApprenticeshipEntry, getCompanyApprenticeshipEntries, getApprenticeApprenticeshipEntries, createAnnouncement, getCompanyAnnouncements, deleteAnnouncement]);
});
