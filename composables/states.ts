import {Message, Ticket, Notification, Comment} from "@prisma/client";
import {SocketStatus, UserAuth} from "~/types";

export const useUser = () => useState<UserAuth>('user', () => {
    return {
        user_id: '',
        auth_key: '',
        is_admin: false,
    }
});

export const useNotifications = () => useState<Notification[]>('Notifications', () => []);
export const useNewMessage = () => useState<Message | null>('NewMessage', () => null);
export const useWsServerStatus = () => useState<SocketStatus>('wsServerStatus', () => SocketStatus.OPEN);
export const useNewTickets = () => useState<Ticket[]>('newTickets', () => []);
export const useTicketsMetaData = () => useState<{ [key: string]: number }>('ticketsMetaData', () => ({
    pending_count: 0,
    resolved_count: 0,
    exceptions_count: 0,
    new_count: 0
}));
export const useNewTicketComment = () => useState<Comment | null>('newTicketComment', () => null);
export const useCommentActions = () => useState<{}>('commentActions', () => ({
    action: '',
    commentId: null
}));

