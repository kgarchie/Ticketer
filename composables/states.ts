import {type UserAuth} from "~/types";
import {type Notification} from "@prisma/client";

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