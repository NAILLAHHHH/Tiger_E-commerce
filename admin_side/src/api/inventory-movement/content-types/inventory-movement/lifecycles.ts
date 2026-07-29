import { errors } from '@strapi/utils';
import { isSystemAuditWrite } from '../../../../utils/inventory-log';

function rejectMutation() {
  if (isSystemAuditWrite()) return;

  throw new errors.ForbiddenError(
    'Stock movements are read-only. They are recorded automatically for restocks and adjustments.',
  );
}

export default {
  beforeCreate: rejectMutation,
  beforeUpdate: rejectMutation,
  beforeDelete: rejectMutation,
};
