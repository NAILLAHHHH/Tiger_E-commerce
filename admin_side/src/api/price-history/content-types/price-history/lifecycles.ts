import { errors } from '@strapi/utils';
import { isSystemAuditWrite } from '../../../../utils/inventory-log';

function rejectMutation() {
  if (isSystemAuditWrite()) return;

  throw new errors.ForbiddenError(
    'Price changes are read-only. They are recorded automatically when prices are updated.',
  );
}

export default {
  beforeCreate: rejectMutation,
  beforeUpdate: rejectMutation,
  beforeDelete: rejectMutation,
};
