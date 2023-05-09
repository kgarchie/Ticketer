import {H3Event} from "h3";
import {HttpResponseTemplate} from "~/types";
import {getTicketsCreatedByUser} from "~/mvc/tickets/queries";
import {getAdmins, getUserNameOrUser_Id, getUserOrEphemeralUser_Secure} from "~/mvc/user/queries";

export async function getUser(event:H3Event){
    const user_id = event.context.params?.id as string | null;
    let response = {} as HttpResponseTemplate;

    if (!user_id) {
        response.statusCode = 400
        response.body = "No user provided"
        return response
    }

    const user = await getUserNameOrUser_Id(user_id)
    response.statusCode = 200
    response.body = user

    return response
}

export async function getAdminUsers(){
    const response = {} as HttpResponseTemplate;

    response.statusCode = 200
    response.body = await getAdmins()

    return response
}


export async function getUserTickets(event:H3Event){
    const user_id = event.context.params?.id as string | null;
    let response = {} as HttpResponseTemplate;

    if (!user_id) {
        response.statusCode = 400
        response.body = "No user provided"
        return response
    }

    const userTickets = await getTicketsCreatedByUser(user_id)

    response.statusCode = 200
    response.body = userTickets

    return response
}