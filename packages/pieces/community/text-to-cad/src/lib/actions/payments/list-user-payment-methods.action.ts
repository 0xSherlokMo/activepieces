import { createAction, Property } from '@activepieces/pieces-framework';
import { textToCadAuth } from '../../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listUserPaymentMethodsAction = createAction({
  name: 'list_user_payment_methods',
  displayName: 'List User Payment Methods',
  description: 'List all payment methods for your user account',
  auth: textToCadAuth,
  category: 'Payments',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      description: 'Maximum number of payment methods to return',
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
      description: 'Number of payment methods to skip',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/payment/methods',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      queryParams: {
        ...(propsValue.limit && { limit: propsValue.limit.toString() }),
        ...(propsValue.offset && { offset: propsValue.offset.toString() }),
      },
    });
    return response.body;
  },
});
