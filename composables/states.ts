import { type UserAuth } from "~/types";
import { type Notification } from "@prisma/client";
import { RealTime } from "#imports";

export const useUser = () => useState<UserAuth>('user', () => {
    return {
        user_id: '',
        auth_key: '',
        is_admin: false,
    }
});

type Notifications = { id: number | 0, message: string, opened: boolean}[]
export const useCall = () => useState<any>('call', () => null);
export const useGlobalSocket = () => useState<any>('globalSocket', () => null);
export const useNotifications = () => useState<Notifications>('notifications', () => []);
export const useSocket = () => useState<RealTime | undefined>('socket', () => undefined);