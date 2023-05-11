<template>
    <Head to="head">
        <Title>Login</Title>
    </Head>
    <div class="hero is-halfheight">
        <div class="hero-body is-justify-content-center is-align-items-center">
            <form class="is-flex is-flex-direction-column box" @submit.prevent="register">
                <div class="column">
                    <label for="name">Username</label>
                    <input class="input is-primary" type="text" placeholder="Name" autocomplete="name"
                           id="name" v-model="name" required>
                </div>
                <div class="column">
                    <label for="email">Email</label>
                    <input class="input is-primary" type="email" placeholder="Email address" autocomplete="email"
                           id="email" v-model="email" required>
                </div>
                <div class="column">
                    <label for="company">Company</label>
                    <div class="field">
                       <div class="control">
                           <select name="company" v-model="company" class="select is-primary" id="company">
                               <option value="">
                                   Optional
                               </option>
                               <option v-for="company in companies" :key="company.id" :value="company.id">
                                   {{ company.name }}
                               </option>
                           </select>
                       </div>
                    </div>
                </div>
                <div class="column">
                    <label for="Name">Password</label>
                    <input class="input is-primary" type="password" placeholder="Password"
                           autocomplete="current-password" id="password1" v-model="password1" required>
                    <small class="has-text-danger" id="no-match">Passwords Do Not Match</small>
                </div>
                <div class="column">
                    <label for="password">Password Again</label>
                    <input class="input is-primary" type="password" placeholder="Password"
                           autocomplete="current-password" id="password2" v-model="password2" required>
                    <a href="" class="is-size-7 has-text-primary">Forgot password?</a>
                </div>
                <div class="column">
                    <button class="button is-primary is-fullwidth" type="submit" id="submit-btn" disabled>Register
                    </button>
                </div>
                <div class="has-text-centered">
                    <p class="is-size-7"> Already have an account? <NuxtLink to="/auth/login" class="has-text-primary">Log In</NuxtLink>
                    </p>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import {RegisterCredentials, UserAuth} from "~/types";

let companies = null
const {data:companies_data} = await useFetch('/api/company')
if(companies_data.value){
    companies = companies_data.value.body
} else {
    console.log(companies_data)
}
const email = ref('')
const name = ref('')
const company = ref('')
const password1 = ref('')
const password2 = ref('')

const {user_id} = useCookie<UserAuth>('auth').value || {auth_key: false}

const register = async () => {
    if(password1.value === password2.value && name.value && email.value){
        const {data: response} = await useFetch('/api/auth/identity/register', {
            method: 'POST',
            body: JSON.stringify({
                email: email.value,
                password: password2.value,
                user_id: user_id,
                name: name.value,
                company: company.value
            } as RegisterCredentials)
        })

        if(response?.value?.statusCode === 200){
            console.log(response.value)
            window.location.href = '/'
        } else {
            alert(response.value.body)
            await navigateTo({path: '/auth/identity/register'})
        }
    }
}

onMounted(()=>{
    document.getElementById('no-match')?.classList.add('hidden')
})

watch([password1, password2, email, name], () => {
    const submitBtn = document.getElementById('submit-btn')

    if(password2.value && password1.value !== password2.value){
        document.getElementById('no-match')?.classList.remove("hidden")
    } else {
        document.getElementById('no-match')?.classList.add("hidden")
        // @ts-ignore
        submitBtn.disabled = !(name.value && email.value);
    }
})

</script>

<style scoped>
small{
    font-size: 0.8rem;
}

.hidden{
    display: none;
}

.select{
    width: 100%;
    border-color: #00d1b2;
    box-shadow: inset 0 0.0625em 0.125em rgba(10, 10, 10, 0.05);
    max-width: 100%;
    background-color: white;
    border-radius: 4px;
    color: #363636;
    height: auto;

    padding: 11px 5px;
}

.select:focus{
    box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);
    outline: #00c4a7;
}
</style>