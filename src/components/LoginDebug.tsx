import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { healthMapsAuthService } from '../services/healthMapsAuthService';

const LoginDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const [testEmail, setTestEmail] = useState('chiran9590@gmail.com');
  const [testPassword, setTestPassword] = useState('');

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      const { session, error } = await healthMapsAuthService.getCurrentSession();
      setDebugInfo(prev => ({ ...prev, currentSession: session, sessionError: error }));
      
      if (session?.user) {
        const { profile, error: profileError } = await healthMapsAuthService.getProfile(session.user.id);
        setDebugInfo(prev => ({ ...prev, profile, profileError }));
      }
    } catch (error) {
      setDebugInfo(prev => ({ ...prev, sessionCheckError: error }));
    }
  };

  const testDirectAuth = async () => {
    try {
      console.log('🔍 Testing direct Supabase auth...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      setDebugInfo(prev => ({ 
        ...prev, 
        directAuthResult: data, 
        directAuthError: error 
      }));

      if (data?.user) {
        console.log('✅ Direct auth successful, user:', data.user);
        
        // Test profile fetch
        const { profile, error: profileError } = await healthMapsAuthService.getProfile(data.user.id);
        setDebugInfo(prev => ({ 
          ...prev, 
          profileAfterLogin: profile, 
          profileErrorAfterLogin: profileError 
        }));
      }
    } catch (error) {
      setDebugInfo(prev => ({ ...prev, directAuthCatchError: error }));
    }
  };

  const testProfileQuery = async () => {
    try {
      console.log('🔍 Testing direct profile query...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', testEmail);
      
      setDebugInfo(prev => ({ 
        ...prev, 
        directProfileQuery: data, 
        directProfileError: error 
      }));
    } catch (error) {
      setDebugInfo(prev => ({ ...prev, directProfileCatchError: error }));
    }
  };

  const createProfileManually = async () => {
    try {
      console.log('🔧 Creating profile manually...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (data?.user) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            name: 'Chiran',
            email: testEmail,
            role: 'admin'
          }]);

        setDebugInfo(prev => ({ 
          ...prev, 
          manualProfileCreation: { success: !insertError, error: insertError } 
        }));
      }
    } catch (error) {
      setDebugInfo(prev => ({ ...prev, manualProfileCreationError: error }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Login Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Authentication</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={testDirectAuth}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Test Direct Auth
              </button>
              <button
                onClick={testProfileQuery}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Test Profile Query
              </button>
              <button
                onClick={createProfileManually}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Create Profile Manually
              </button>
              <button
                onClick={checkCurrentSession}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Check Session
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LoginDebug;
