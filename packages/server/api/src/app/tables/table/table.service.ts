import { ActivepiecesError, apId, CreateTableRequest, ErrorCode, ExportTableResponse, isNil, Table } from '@activepieces/shared'
import { repoFactory } from '../../core/db/repo-factory'
import { fieldService } from '../field/field.service'
import { RecordEntity } from '../record/record.entity'
import { TableEntity } from './table.entity'

const tableRepo = repoFactory(TableEntity)
const recordRepo = repoFactory(RecordEntity)

export const tableService = {
    async create({ projectId, request }: { projectId: string, request: CreateTableRequest }): Promise<Table> {
        const table = await tableRepo().save({
            id: apId(),
            name: request.name,
            projectId,
        })

        return table
    },

    async getAll({ projectId }: { projectId: string }): Promise<Table[]> {
        return tableRepo().find({
            where: { projectId },
        })
    },

    async getById({ projectId, id }: { projectId: string, id: string }): Promise<Table> {
        const table = await tableRepo().findOne({
            where: { projectId, id },
        })

        if (isNil(table)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'Table',
                    entityId: id,
                },
            })
        }

        return table
    },

    async delete({ projectId, id }: { projectId: string, id: string }): Promise<void> {
        await tableRepo().delete({
            projectId,
            id,
        })
    },

    async exportTable({ projectId, id }: { projectId: string, id: string }): Promise<ExportTableResponse> {
        await this.getById({ projectId, id })
        
        // TODO: Change field sorting to use position when it's added
        const fields = await fieldService.getAll({ projectId, tableId: id })

        const records = await recordRepo().find({
            where: { tableId: id, projectId },
            relations: ['cells'],
        })

        const rows = records.map(record => {
            const row: Record<string, string> = {}
            for (const field of fields) {
                const cell = record.cells.find(c => c.fieldId === field.id)
                row[field.name] = cell?.value?.toString() ?? ''
            }
            return row
        })

        return {
            fields: fields.map(f => ({ id: f.id, name: f.name })),
            rows,
        }
    },
}