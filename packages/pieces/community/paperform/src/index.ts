import { createPiece } from "@activepieces/pieces-framework"
import { paperformAuth } from "./lib/common/auth"

import { newPartialFormSubmission } from './lib/triggers/new-partial-form-submission';
import { newFormSubmission } from './lib/triggers/new-form-submission-';

import { deleteFormSubmission } from './lib/actions/delete-form-submission';
import { deletePartialFormSubmission } from './lib/actions/delete-partial-form-submission';
import { createFormCoupon } from './lib/actions/create-form-coupon';
import { updateFormCoupon } from './lib/actions/update-form-coupon';
import { deleteFormCoupon } from './lib/actions/delete-form-coupon';
import { createFormProduct } from './lib/actions/create-form-product-';
import { updateFormProduct } from './lib/actions/update-form-product';
import { deleteFormProduct } from './lib/actions/delete-form-product';
import { createSpace } from './lib/actions/create-space';
import { updateSpace } from './lib/actions/update-space';

import { findFormProduct } from './lib/actions/find-form-product';
import { findForm } from './lib/actions/find-form';
import { findSpace } from './lib/actions/find-space';

export const paperform = createPiece({
  displayName: "Paperform",
  auth: paperformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/paperform.png",
  authors: ['nuvex-dev'],
  actions: [
    deleteFormSubmission,
    deletePartialFormSubmission,
    createFormCoupon,
    updateFormCoupon,
    deleteFormCoupon,
    createFormProduct,
    updateFormProduct,
    deleteFormProduct,
    createSpace,
    updateSpace,
    findFormProduct,
    findForm,
    findSpace,
  ],
  triggers: [newFormSubmission, newPartialFormSubmission],
});
    