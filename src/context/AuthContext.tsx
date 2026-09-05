import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { StorageService, subscribeToStorage } from '../services/storage';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  loginWithOtp: (mobileNumber: string, otp: string) => { success: boolean; message: string; user?: User };
  sendOtp: (mobileNumber: string) => { success: boolean; message: string; otp?: string };
  logout: () => void;
  isOtpLoggedIn: boolean;
  allUsers: User[];
  isAdmin: boolean;
  isMember: boolean;
  isVillageHead: boolean;
  canManageUsers: boolean;
  canDeleteIssue: boolean;
  canEditSettings: boolean;
  canManageWorks: boolean;
  canManageMeetings: boolean;
  canFixVillageVideoConference: boolean;
  canAssignIssue: boolean;
  canCreateIssue: boolean;
  canCreateFieldVisit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [isOtpLoggedIn, setIsOtpLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('cc_auth_otp_logged') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUserId = localStorage.getItem('cc_auth_current_user_id');
    const list = StorageService.getUsers();
    if (savedUserId) {
      const found = list.find((u) => u.id === savedUserId);
      if (found) return found;
    }
    // Default to Admin for full initial experience
    return list.find((u) => u.role === 'ADMIN') || list[0];
  });

  // Keep a map of active OTPs in session
  const [activeOtps, setActiveOtps] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = subscribeToStorage(() => {
      const updatedUsers = StorageService.getUsers();
      setUsers(updatedUsers);
      const found = updatedUsers.find((u) => u.id === currentUser.id);
      if (found) setCurrentUser(found);
    });
    return unsubscribe;
  }, [currentUser.id]);

  const switchRole = (role: UserRole) => {
    let target = users.find((u) => u.role === role && u.active) || users.find((u) => u.role === role);
    if (!target && role === 'VILLAGE MEMBER') {
      target = {
        id: 'USR-MBR-001',
        name: 'Basavaraj Patil (Village Member)',
        email: 'basavaraj.patil@alabanur.sindhanur.ac',
        role: 'VILLAGE MEMBER',
        phone: '+91 98451 98765',
        designation: 'Cadre Worker / Village Member (Alabanoor)',
        village: 'Alabanoor',
        active: true,
      };
      StorageService.saveUser(target);
    } else if (!target && role === 'VILLAGE HEAD') {
      target = {
        id: 'USR-007',
        name: 'Goudappa Gowda Patil (Village Head)',
        email: 'head.alabanur@sindhanur.gov.in',
        role: 'VILLAGE HEAD',
        phone: '+91 94481 44556',
        designation: 'Grama Pradhan / Village Head (Alabanoor)',
        village: 'Alabanoor',
        active: true,
      };
      StorageService.saveUser(target);
    }
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('cc_auth_current_user_id', target.id);
    }
  };

  const sendOtp = (mobileNumber: string): { success: boolean; message: string; otp?: string } => {
    const cleanNumber = mobileNumber.replace(/[^0-9]/g, '');
    if (cleanNumber.length !== 10) {
      return { success: false, message: 'Please enter a valid 10-digit Indian mobile number.' };
    }

    // Generate deterministic yet secure 6-digit OTP (e.g. based on last digits + fixed algorithm for convenience)
    // Random 6-digit OTP
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    setActiveOtps((prev) => ({ ...prev, [cleanNumber]: generatedOtp }));

    return {
      success: true,
      message: `OTP sent successfully to +91 ${cleanNumber}`,
      otp: generatedOtp,
    };
  };

  const loginWithOtp = (
    mobileNumber: string,
    otp: string
  ): { success: boolean; message: string; user?: User } => {
    const cleanNumber = mobileNumber.replace(/[^0-9]/g, '');
    const cleanOtp = otp.trim();

    if (!cleanOtp) {
      return { success: false, message: 'Please enter the OTP.' };
    }

    // Check if OTP matches active OTP or demo bypass (123456)
    const expectedOtp = activeOtps[cleanNumber];
    if (cleanOtp !== expectedOtp && cleanOtp !== '123456') {
      return { success: false, message: 'Invalid OTP. Please check and re-enter or use demo code 123456.' };
    }

    // 1. First check if it matches a system staff/admin user
    const matchedUser = users.find((u) => {
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      return uPhone === cleanNumber || uPhone.endsWith(cleanNumber);
    });

    if (matchedUser) {
      setCurrentUser(matchedUser);
      setIsOtpLoggedIn(true);
      localStorage.setItem('cc_auth_otp_logged', 'true');
      localStorage.setItem('cc_auth_current_user_id', matchedUser.id);
      return { success: true, message: `Welcome back, ${matchedUser.name}! Logged in as ${matchedUser.role}.`, user: matchedUser };
    }

    // 2. Next check if it matches a registered Village Member
    const member = StorageService.getMemberByMobile(cleanNumber);
    if (member) {
      const memberUser: User = {
        id: member.id,
        name: member.nameAsPerAadhaar,
        email: `${member.id.toLowerCase()}@constituency.kar.gov.in`,
        role: 'VILLAGE MEMBER',
        phone: member.mobileNumber,
        department: 'Village Cadre',
        designation: `${member.role} (${member.village})`,
        active: true,
        village: member.village,
      };

      // Add to users list if not already present
      StorageService.saveUser(memberUser);
      setCurrentUser(memberUser);
      setIsOtpLoggedIn(true);
      localStorage.setItem('cc_auth_otp_logged', 'true');
      localStorage.setItem('cc_auth_current_user_id', memberUser.id);
      return {
        success: true,
        message: `Welcome ${member.nameAsPerAadhaar}! Logged in as Village Member (${member.village}).`,
        user: memberUser,
      };
    }

    // 3. If new number, create a Citizen / Member profile
    const newCitizenUser: User = {
      id: `USR-MBL-${cleanNumber.slice(-4)}`,
      name: `Citizen (+91 ${cleanNumber})`,
      email: `citizen.${cleanNumber}@constituency.kar.gov.in`,
      role: 'VILLAGE MEMBER',
      phone: cleanNumber,
      department: 'Public Grievance Citizen',
      designation: 'Sindhanur Citizen / Cadre',
      active: true,
      village: 'Sindhanur',
    };

    StorageService.saveUser(newCitizenUser);
    setCurrentUser(newCitizenUser);
    setIsOtpLoggedIn(true);
    localStorage.setItem('cc_auth_otp_logged', 'true');
    localStorage.setItem('cc_auth_current_user_id', newCitizenUser.id);

    return {
      success: true,
      message: `Verified successfully! Logged in as Citizen Member.`,
      user: newCitizenUser,
    };
  };

  const logout = () => {
    setIsOtpLoggedIn(false);
    localStorage.removeItem('cc_auth_otp_logged');
    // Revert to admin for demo convenience
    const adminUser = users.find((u) => u.role === 'ADMIN') || users[0];
    if (adminUser) {
      setCurrentUser(adminUser);
      localStorage.setItem('cc_auth_current_user_id', adminUser.id);
    }
  };

  const role = currentUser.role;
  const isAdmin = role === 'ADMIN';
  const isMember = role === 'VILLAGE MEMBER';
  const isVillageHead = role === 'VILLAGE HEAD';

  const value: AuthContextType = {
    currentUser,
    setCurrentUser,
    switchRole,
    loginWithOtp,
    sendOtp,
    logout,
    isOtpLoggedIn,
    allUsers: users,
    isAdmin,
    isMember,
    isVillageHead,
    canManageUsers: isAdmin,
    canDeleteIssue: isAdmin,
    canEditSettings: isAdmin,
    canManageWorks: isAdmin || role === 'STAFF',
    canManageMeetings: isAdmin || role === 'STAFF' || role === 'VILLAGE HEAD',
    canFixVillageVideoConference: isAdmin || role === 'VILLAGE HEAD',
    canAssignIssue: isAdmin || role === 'STAFF',
    canCreateIssue: true,
    canCreateFieldVisit: isAdmin || role === 'FIELD EXECUTIVE',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
