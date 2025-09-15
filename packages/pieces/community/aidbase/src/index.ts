
    import { createPiece } from "@activepieces/pieces-framework";
    import { aidbaseAuth } from "./lib/common/auth";
    import { emailReceived } from './lib/triggers/email-received';
    import { emailStatusChanged } from './lib/triggers/email-status-changed';
    import { emailPriorityChanged } from './lib/triggers/email-priority-changed';
    import { emailSent } from './lib/triggers/email-sent';
    import { ticketCreated } from './lib/triggers/ticket-created';
    import { ticketPriorityChanged } from './lib/triggers/ticket-priority-changed';
    import { ticketStatusChanged } from './lib/triggers/ticket-status-changed';
    import { ticketNewComment } from './lib/triggers/ticket-new-comment';
    import { addVideo } from './lib/actions/add-video';
    import { addWebsite } from './lib/actions/add-website';
    import { addFaqItem } from './lib/actions/add-faq-item';
    import { createFaq } from './lib/actions/create-faq';
    import { createChatbotReply } from './lib/actions/create-chatbot-reply';
    import { startTraining } from './lib/actions/start-training';
    
    export const aidbase = createPiece({
      displayName: 'Aidbase',
      auth: aidbaseAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: 'https://cdn.activepieces.com/pieces/aidbase.png',
      authors: ['Prabhukiran161'],
      actions: [
        addVideo,
        addWebsite,
        addFaqItem,
        createFaq,
        createChatbotReply,
        startTraining,
      ],
      triggers: [
        emailReceived,
        emailStatusChanged,
        emailPriorityChanged,
        emailSent,
        ticketCreated,
        ticketPriorityChanged,
        ticketStatusChanged,
        ticketNewComment,
      ],
    });
    