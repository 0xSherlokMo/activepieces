import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	propertiesDropdown,
	getDefaultPropertiesForObject,
} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/shared';

export const getProductAction = createAction({
	auth: hubspotAuth,
	name: 'get-product',
	displayName: 'Get Product',
	description: 'Gets a product.',
	props: {
		productId: Property.ShortText({
			displayName: 'Product ID',
			description: 'The ID of the product to get.',
			required: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `### Properties to retrieve:
											
                    createdate, description, name, price, tax, hs_lastmodifieddate	
																	
					**Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: propertiesDropdown({
			objectType: OBJECT_TYPE.PRODUCT,
			displayName: 'Additional properties to retrieve',
			required: false,
		}),
	},
	async run(context) {
		const { productId } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultProductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.PRODUCT);

		const client = new Client({ accessToken: context.auth.access_token });

		const productDetails = await client.crm.products.basicApi.getById(productId, [
			...defaultProductProperties,
			...additionalPropertiesToRetrieve,
		]);

		return productDetails;
	},
});
