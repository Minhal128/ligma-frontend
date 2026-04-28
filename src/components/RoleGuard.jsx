import React from 'react';

export default function RoleGuard({ userRole, allowed, children }) {
  if (!allowed.includes(userRole)) return null;
  return <>{children}</>;
}
