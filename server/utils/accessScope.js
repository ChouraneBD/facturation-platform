const isAdmin = (user) => user?.role === 'admin';

const factureScopeWhere = (user) => (isAdmin(user) ? {} : { user_id: user.id });

const canAccessFacture = (user, facture) => isAdmin(user) || facture?.user_id === user.id;

module.exports = {
  isAdmin,
  factureScopeWhere,
  canAccessFacture
};
