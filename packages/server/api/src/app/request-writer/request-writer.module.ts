import { CopilotGenerateRequest, GenerateCodeResponse, WebsocketClientEvent, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { websocketService } from '../websockets/websockets.service'
import { requestWriterService } from './request-writer.service'

export const requestWriterModule: FastifyPluginAsyncTypebox = async () => {
    websocketService.addListener(WebsocketServerEvent.GENERATE_HTTP_REQUEST, (socket) => {
        return async (data: CopilotGenerateRequest) => {
            const { prompt } = data
            const result = await requestWriterService.generateCode({ prompt })
            const response: GenerateCodeResponse = {
                result,
            }
            socket.emit(WebsocketClientEvent.GENERATE_HTTP_REQUEST_FINISHED, response)
        }
    })
}
