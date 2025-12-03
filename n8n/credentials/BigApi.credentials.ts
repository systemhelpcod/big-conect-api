import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class BigApiApi implements ICredentialType {
	name = 'bigApi';
	displayName = 'Big API';
	properties = [
		{
			displayName: 'Token da API (se necessário)',
			name: 'apiKey',
			type: 'string' as NodePropertyTypes,
			default: '',
		},
	];
}
