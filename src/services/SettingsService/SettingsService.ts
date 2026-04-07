import { customFetch } from '@/utils/customFetch'
import { environment } from '@/environments'
import type {
	ProviderSettingsDto,
	PropagationRuleDto,
	PropagationRuleCreateDto,
} from '@/models/api'

const { apiRoutes } = environment

export const getProviderSettings = async (): Promise<ProviderSettingsDto> => {
	return await customFetch<ProviderSettingsDto>(apiRoutes.settings.providers)
}

export const getPropagationRules = async (): Promise<PropagationRuleDto[]> => {
	return await customFetch<PropagationRuleDto[]>(apiRoutes.settings.propagation)
}

export const createPropagationRule = async (
	data: PropagationRuleCreateDto
): Promise<PropagationRuleDto> => {
	return await customFetch<PropagationRuleDto>(apiRoutes.settings.propagation, {
		method: 'POST',
		body: data,
	})
}

export const updatePropagationRule = async (id: number, isActive: boolean): Promise<void> => {
	await customFetch<void>(apiRoutes.settings.propagationById(id), {
		method: 'PUT',
		body: { isActive },
	})
}

export const deletePropagationRule = async (id: number): Promise<void> => {
	await customFetch<void>(apiRoutes.settings.propagationById(id), {
		method: 'DELETE',
	})
}
