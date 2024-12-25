import { api } from '@/lib/api';
import {
  CreateRecordsRequest,
  ListRecordsRequest,
  PopulatedRecord,
  SeekPage,
  UpdateRecordRequest,
} from '@activepieces/shared';

export const recordsApi = {
  list(request: ListRecordsRequest): Promise<SeekPage<PopulatedRecord>> {
    return api.get<SeekPage<PopulatedRecord>>('/v1/records', request);
  },

  create(request: CreateRecordsRequest): Promise<PopulatedRecord[]> {
    return api.post<PopulatedRecord[]>('/v1/records', request);
  },

  getById(id: string): Promise<PopulatedRecord> {
    return api.get<PopulatedRecord>(`/v1/records/${id}`);
  },

  update(id: string, request: UpdateRecordRequest): Promise<PopulatedRecord> {
    return api.post<PopulatedRecord>(`/v1/records/${id}`, request);
  },

  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/records/${id}`);
  },
};
