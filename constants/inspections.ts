import { PlantInspectionItem, QuickHitchItem } from '@/types';

export const PLANT_INSPECTION_ITEMS: PlantInspectionItem[] = [
  { id: 'service', name: 'Item is within Service period', icon: 'calendar' },
  { id: 'steering', name: 'Steering', icon: 'steering-wheel' },
  { id: 'brakes', name: 'Brakes', icon: 'disc' },
  { id: 'tyres', name: 'Tyres incl. pressure', icon: 'circle' },
  { id: 'wheels', name: 'Wheels', icon: 'circle-dot' },
  { id: 'tracks', name: 'Tracks', icon: 'link' },
  { id: 'suspension', name: 'Suspension', icon: 'move-vertical' },
  { id: 'chassis', name: 'Chassis', icon: 'box' },
  { id: 'rollover', name: 'Roll Over Protection', icon: 'shield' },
  { id: 'ropes', name: 'Ropes', icon: 'cable' },
  { id: 'hydraulics', name: 'Hydraulics / Oils', icon: 'droplet' },
  { id: 'lights', name: 'Lights', icon: 'lightbulb' },
  { id: 'screen', name: 'Screen & Cab Glass/Windo', icon: 'monitor' },
  { id: 'seats', name: 'Seats & Seat Belts', icon: 'armchair' },
  { id: 'wipers', name: 'Wipers', icon: 'wind' },
  { id: 'mirrors', name: 'Rear View Mirrors', icon: 'scan' },
];

export const PLANT_INSPECTION_SECONDARY_ITEMS: PlantInspectionItem[] = [
  { id: 'horn', name: 'Horn', icon: 'volume-2' },
  { id: 'audible', name: 'Audible warning', icon: 'bell' },
  { id: 'beacons', name: 'Visual Beacons', icon: 'lightbulb' },
  { id: 'jib', name: 'Jib', icon: 'move' },
  { id: 'exhaust', name: 'Exhaust System', icon: 'wind' },
  { id: 'engine', name: 'Engine', icon: 'cpu' },
  { id: 'quickrelease', name: 'Quick Release Mechanism', icon: 'unplug' },
  { id: 'safeload', name: 'Safe Load Indicator', icon: 'alert-triangle' },
  { id: 'fire', name: 'Fire Extinguisher', icon: 'flame' },
  { id: 'guards', name: 'Guards', icon: 'shield-check' },
  { id: 'radiator', name: 'Radiator', icon: 'thermometer' },
  { id: 'fuel', name: 'Fuel System', icon: 'fuel' },
  { id: 'hoses', name: 'Hoses/Airlines /Couplings etc.', icon: 'cable' },
  { id: 'neutral', name: 'Neutral Start', icon: 'circle-pause' },
  { id: 'grease', name: 'Grease parts', icon: 'droplets' },
  { id: 'general', name: 'General Condition', icon: 'clipboard-check' },
];

export const QUICK_HITCH_ITEMS: QuickHitchItem[] = [
  { id: 'qh_controls', category: 'In Cab', name: 'Quick hitch operating controls working correctly', requiresDaily: true },
  { id: 'qh_instructions', category: 'In Cab', name: 'Operating instructions and safety labels are present and legible', requiresDaily: true },
  { id: 'hs_wear', category: 'Hydraulic System', name: 'No wear or damage to hoses or fittings', requiresDaily: true },
  { id: 'hs_security', category: 'Hydraulic System', name: 'Hoses are secure and correctly routed', requiresDaily: true },
  { id: 'hs_leaks', category: 'Hydraulic System', name: 'No hydraulic oil leaks visible', requiresDaily: true },
  { id: 'qh_damage', category: 'Quick Hitch', name: 'No visible damage to quick hitch', requiresDaily: true },
  { id: 'qh_safety', category: 'Quick Hitch', name: 'Safety device (springs, clips, cylinder) functions correctly', requiresDaily: true },
  { id: 'qh_buildup_device', category: 'Quick Hitch', name: 'No build-up of dirt or debris around safety device', requiresDaily: true },
  { id: 'qh_buildup_hooks', category: 'Quick Hitch', name: 'No build-up of dirt or debris on hooks', requiresDaily: true },
  { id: 'qh_hooks_wear', category: 'Quick Hitch', name: 'Hooks show no signs of wear or damage', requiresDaily: true },
  { id: 'qh_mechanism_wear', category: 'Quick Hitch', name: 'Mechanism operates smoothly with no excessive wear', requiresDaily: true },
  { id: 'qh_bucket_wear', category: 'Quick Hitch', name: 'Bucket/attachment pins and retainers are secure and undamaged', requiresDaily: true },
  { id: 'qh_mounting', category: 'Quick Hitch', name: 'Mounting pins, locking bolts, and nuts are tight and secure', requiresDaily: true },
  { id: 'qh_safe', category: 'Quick Hitch', name: 'Quick hitch is safe to use today', requiresDaily: true },
  { id: 'qh_understood', category: 'Quick Hitch', name: 'Operator has read and understands how to use this quick hitch', requiresDaily: true },
  { id: 'gr_greasing', category: 'Greasing', name: 'Greased in line with manufacturer\'s instructions', requiresDaily: false },
  { id: 'bc_area', category: 'Bucket Changing Area', name: 'Bucket changing area is in place and being used correctly', requiresDaily: false },
];

export const DAYS_OF_WEEK = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'] as const;

export const CHECK_STATUS_OPTIONS = [
  { value: 'A', label: 'A', color: '#10b981' },
  { value: 'B', label: 'B', color: '#f59e0b' },
  { value: 'C', label: 'C', color: '#ef4444' },
  { value: 'N/A', label: 'N/A', color: '#9ca3af' },
] as const;

export const BUCKET_CHANGE_ITEMS = [
  { id: 'bucket_correct', name: 'Bucket is on correct', category: 'Installation' },
  { id: 'shake_test', name: 'Shake test completed', category: 'Testing' },
  { id: 'rattle_test', name: 'Rattle test completed', category: 'Testing' },
  { id: 'roll_test', name: 'Roll test completed', category: 'Testing' },
  { id: 'pins_secure', name: 'Pins are secure', category: 'Safety' },
  { id: 'locking_mechanism', name: 'Locking mechanism engaged', category: 'Safety' },
  { id: 'visual_inspection', name: 'Visual inspection completed', category: 'Safety' },
];

export const IMPLEMENT_TYPES = [
  '1 ft bucket',
  '1.5 ft bucket',
  '2 ft bucket',
  '3 ft bucket',
  '4 ft bucket',
  '5 ft bucket',
  'Ditching / Grading bucket',
  'Hydraulic breaker (pecker)',
  'Auger',
  'Grapple / Grab',
  'Ripper tooth',
  'Compaction plate',
  'Piling hammer',
  'Tilt rotator',
  'Hydraulic thumb',
  'Trenching attachment',
  'Screening bucket',
  'Other',
] as const;

export const VEHICLE_INSPECTION_ITEMS = [
  { id: 'lights_front', name: 'Lights - Front', category: 'Exterior' },
  { id: 'lights_rear', name: 'Lights - Rear', category: 'Exterior' },
  { id: 'indicators', name: 'Indicators', category: 'Exterior' },
  { id: 'brake_lights', name: 'Brake Lights', category: 'Exterior' },
  { id: 'hazard_lights', name: 'Hazard Lights', category: 'Exterior' },
  { id: 'tyres_condition', name: 'Tyres - Condition', category: 'Tyres & Wheels' },
  { id: 'tyres_pressure', name: 'Tyres - Pressure', category: 'Tyres & Wheels' },
  { id: 'tyres_tread', name: 'Tyres - Tread Depth', category: 'Tyres & Wheels' },
  { id: 'wheel_nuts', name: 'Wheel Nuts', category: 'Tyres & Wheels' },
  { id: 'spare_wheel', name: 'Spare Wheel', category: 'Tyres & Wheels' },
  { id: 'windscreen', name: 'Windscreen', category: 'Glass & Visibility' },
  { id: 'windows', name: 'Windows', category: 'Glass & Visibility' },
  { id: 'mirrors', name: 'Mirrors', category: 'Glass & Visibility' },
  { id: 'wipers', name: 'Wipers & Washers', category: 'Glass & Visibility' },
  { id: 'horn', name: 'Horn', category: 'Controls' },
  { id: 'steering', name: 'Steering', category: 'Controls' },
  { id: 'brakes', name: 'Brakes', category: 'Controls' },
  { id: 'handbrake', name: 'Handbrake', category: 'Controls' },
  { id: 'seat_belts', name: 'Seat Belts', category: 'Safety' },
  { id: 'seats', name: 'Seats', category: 'Safety' },
  { id: 'fire_extinguisher', name: 'Fire Extinguisher', category: 'Safety' },
  { id: 'first_aid', name: 'First Aid Kit', category: 'Safety' },
  { id: 'warning_triangle', name: 'Warning Triangle', category: 'Safety' },
  { id: 'oil_level', name: 'Oil Level', category: 'Fluids' },
  { id: 'coolant_level', name: 'Coolant Level', category: 'Fluids' },
  { id: 'brake_fluid', name: 'Brake Fluid', category: 'Fluids' },
  { id: 'washer_fluid', name: 'Washer Fluid', category: 'Fluids' },
  { id: 'fuel_level', name: 'Fuel Level', category: 'Fluids' },
  { id: 'body_damage', name: 'Body Damage', category: 'General' },
  { id: 'cleanliness', name: 'Cleanliness', category: 'General' },
  { id: 'documentation', name: 'Documentation (Insurance, MOT, Tax)', category: 'General' },
];

export const HAZARD_SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#10b981', description: 'Minor hazard with low risk' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', description: 'Moderate hazard requiring attention' },
  { value: 'high', label: 'High', color: '#ef4444', description: 'Serious hazard requiring immediate action' },
] as const;

export const GREASING_CHECK_ITEMS = [
  { id: 'all_points_greased', name: 'All grease points located and greased', category: 'Lubrication' },
  { id: 'correct_grease_type', name: 'Correct grease type used', category: 'Lubrication' },
  { id: 'proper_amount', name: 'Proper amount of grease applied', category: 'Lubrication' },
  { id: 'no_leaks', name: 'No grease leaks detected', category: 'Inspection' },
  { id: 'fittings_clean', name: 'Grease fittings clean and functional', category: 'Inspection' },
  { id: 'worn_parts', name: 'No excessively worn parts detected', category: 'Inspection' },
  { id: 'damaged_seals', name: 'No damaged seals or boots', category: 'Inspection' },
  { id: 'proper_access', name: 'All points accessible for greasing', category: 'Inspection' },
];
