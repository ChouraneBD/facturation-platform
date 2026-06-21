const isAdmin = (user) => user?.role === 'admin';

const factureScopeWhere = (user) => (isAdmin(user) ? {} : { user_id: user.id });

const canAccessFacture = (user, facture) => isAdmin(user) || facture?.user_id === user.id;

const clientScopeWhere = (user) => (isAdmin(user) ? {} : { email: user.email });

const canAccessClient = (user, client) => isAdmin(user) || client?.email === user.email;

module.exports = {
  isAdmin,
  factureScopeWhere,
  canAccessFacture,
  clientScopeWhere,
  canAccessClient
};
