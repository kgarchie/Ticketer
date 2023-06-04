import {UserAuth} from "~/types";
import {Notification} from "@prisma/client";

export const useUser = () => useState<UserAuth>('user', () => {
    return {
        user_id: '',
        auth_key: '',
        is_admin: false,
    }
});

export const useCall = () => useState<any>('call', () => null);
export const useGlobalSocket = () => useState<any>('globalSocket', () => null);
export const useNotifications = () => useState<Notification[]>('notifications', () => []);
export const useTicketsMetaData = () => useState<{ [key: string]: number }>('TicketsMetaData', () => ({
    pending_count: 0,
    resolved_count: 0,
    exceptions_count: 0,
    new_count: 0
}));