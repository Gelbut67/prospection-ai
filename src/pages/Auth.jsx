import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Target, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast.success('Connexion réussie !');
      } else {
        const { data } = await signUp(email, password);
        console.log('Signup response:', data);
        
        // Si l'utilisateur est créé mais pas confirmé, on le connecte quand même
        if (data?.user) {
          // Essayer de se connecter directement
          try {
            await signIn(email, password);
            toast.success('Compte créé et connecté !');
          } catch (loginError) {
            toast.success('Compte créé ! Connectez-vous maintenant.');
            setMode('signin');
          }
        } else {
          toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-3 rounded-xl">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Prospection AI</h1>
          </div>
          <p className="text-gray-600">
            {mode === 'signin' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.fr"
              />
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {mode === 'signin' ? (
              <>
                Pas encore de compte ?{' '}
                <button onClick={() => setMode('signup')} className="text-primary-600 hover:underline font-medium">
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button onClick={() => setMode('signin')} className="text-primary-600 hover:underline font-medium">
                  Se connecter
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
