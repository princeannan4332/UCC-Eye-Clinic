import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load stored session
        const storedUser = localStorage.getItem('optiflow_user');
        const storedProfile = localStorage.getItem('optiflow_profile');
        if (storedUser && storedProfile) {
            try {
                setUser(JSON.parse(storedUser));
                setProfile(JSON.parse(storedProfile));
            } catch (e) {
                console.error('Error parsing stored session:', e);
            }
        }
        setLoading(false);

        // Supabase Auth listener
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                try {
                    const res = await api.getProfile(session.user.id);
                    if (res.profile) {
                        setProfile(res.profile);
                        localStorage.setItem('optiflow_profile', JSON.stringify(res.profile));
                    }
                } catch (e) {
                    console.error('Error fetching auth profile:', e);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                localStorage.removeItem('optiflow_user');
                localStorage.removeItem('optiflow_profile');
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const login = async (email, password) => {
        setLoading(true);
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPass = (password || '').trim();

        // 1. Call Backend Login Validation Endpoint
        const authRes = await api.loginUser(cleanEmail, cleanPass);

        if (authRes.error) {
            setLoading(false);
            return {
                success: false,
                error: authRes.error
            };
        }

        if (authRes.requiresOtp) {
            setLoading(false);
            return {
                success: true,
                requiresOtp: true,
                email: cleanEmail
            };
        }

        const activeProfile = authRes.profile;
        const activeUser = authRes.user || { id: activeProfile?.id, email: activeProfile?.email };

        // Attempt Supabase auth sync if available
        try {
            await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass }).catch(() => {});
        } catch (e) {}

        setUser(activeUser);
        setProfile(activeProfile);
        localStorage.setItem('optiflow_user', JSON.stringify(activeUser));
        localStorage.setItem('optiflow_profile', JSON.stringify(activeProfile));

        setLoading(false);
        return { success: true, requiresOtp: false, profile: activeProfile };
    };



    const signup = async (email, password, fullName, role = 'student', phone = '') => {
        setLoading(true);
        const cleanEmail = (email || '').trim().toLowerCase();

        try {
            let supabaseUser = null;
            try {
                const { data } = await supabase.auth.signUp({
                    email: cleanEmail,
                    password,
                    options: {
                        data: { full_name: fullName, role, phone }
                    }
                });
                if (data?.user) supabaseUser = data.user;
            } catch (sbErr) {
                console.warn('Supabase signup fallback mode:', sbErr);
            }

            const newId = supabaseUser?.id || generateUUID();
            const newProfile = {
                id: newId,
                email: cleanEmail,
                full_name: fullName,
                role: role,
                phone: phone || null,
                personal_contact: phone || null,
                onboarding_completed: false
            };

            // Save profile to database
            const syncRes = await api.syncProfile(newProfile);
            const savedProfile = (syncRes && syncRes.profile) ? syncRes.profile : newProfile;

            const currentUser = supabaseUser || { id: newId, email: cleanEmail };
            setUser(currentUser);
            setProfile(savedProfile);
            localStorage.setItem('optiflow_user', JSON.stringify(currentUser));
            localStorage.setItem('optiflow_profile', JSON.stringify(savedProfile));

            setLoading(false);
            return { success: true, profile: savedProfile };
        } catch (err) {
            setLoading(false);
            return {
                success: false,
                error: err.message || 'Could not complete registration. Please try again.'
            };
        }
    };

    // Called after OTP is verified — the profile already exists in DB
    const completeRegistration = (verifiedProfile, verifiedUser) => {
        const currentUser = verifiedUser || { id: verifiedProfile.id, email: verifiedProfile.email };
        setUser(currentUser);
        setProfile(verifiedProfile);
        localStorage.setItem('optiflow_user', JSON.stringify(currentUser));
        localStorage.setItem('optiflow_profile', JSON.stringify(verifiedProfile));
    };

    const updateProfileData = async (onboardingData) => {
        if (!profile?.id) return { success: false, error: 'No active user session found.' };
        setLoading(true);
        try {
            const updatedProfile = {
                ...profile,
                ...onboardingData,
                onboarding_completed: true
            };

            const res = await api.updateProfile(profile.id, onboardingData);
            const finalProfile = (res && res.profile) ? { ...res.profile, onboarding_completed: true } : updatedProfile;

            setProfile(finalProfile);
            localStorage.setItem('optiflow_profile', JSON.stringify(finalProfile));
            setLoading(false);
            return { success: true, profile: finalProfile };
        } catch (err) {
            setLoading(false);
            return { success: false, error: err.message || 'Failed to update onboarding data' };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {}
        setUser(null);
        setProfile(null);
        localStorage.removeItem('optiflow_user');
        localStorage.removeItem('optiflow_profile');
        localStorage.removeItem('optiflow_current_page');
        if (window.location.pathname !== '/login') {
            window.history.pushState(null, '', '/login');
            window.dispatchEvent(new Event('popstate'));
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, login, signup, completeRegistration, updateProfileData, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
