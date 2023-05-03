<template>
    <Head>
        <Title>Create Ticket</Title>
    </Head>
    <main class="container">
        <div class="columns">
            <SideNav/>
            <div class="column is-10">
                <form method="post" class="columns limited-form"
                      @submit.prevent="createNewTicket()">
                    <div class="column is-three-fifths">
                        <div class="field">
                            <label class="label">Reference</label>
                            <div class="control">
                                <input class="input" type="text" placeholder="Transaction Code or Ref Number"
                                       name="reference" v-model="reference" autocomplete="none">
                                <p class="help is-info">Required</p>
                            </div>
                        </div>

                        <div class="field">
                            <label class="label">Safaricom Phone Number</label>
                            <div class="control">
                                <input class="input" type="text" inputmode="number" required name="safaricom_no"
                                       v-model="safaricom_no">
                            </div>
                            <p class="help is-info">Required</p>
                        </div>

                        <div class="field">
                            <label class="label">Airtel Phone Number</label>
                            <div class="control">
                                <input class="input" type="text" inputmode="number" required name="airtel_no"
                                       v-model="airtel_no">
                            </div>
                            <p class="help is-info">Required</p>
                        </div>

                        <div class="field">
                            <label class="label">Amount</label>
                            <div class="control">
                                <input class="input" type="number" name="amount" required v-model="amount">
                                <p class="help is-info">Required</p>
                            </div>
                        </div>
                    </div>

                    <div class="column is-three-fifths">
                        <div class="field">
                            <label class="label">Name</label>
                            <div class="control">
                                <input class="input" type="text" placeholder="Sender Name or Identifier" name="name"
                                       v-model="name">
                                <p class="help is-success">Optional</p>
                            </div>
                        </div>

                        <div class="field">
                            <label class="label">Issue</label>
                            <div class="control">
                                <div class="select my-select">
                                    <select name="issue" v-model="issue">
                                        <option value="EA">Excess Airtime</option>
                                        <option value="BWN">Buying To Wrong Number</option>
                                        <option value="NC">Not Credited</option>
                                        <option value="O">Other</option>
                                    </select>
                                </div>
                            </div>
                            <p class="help is-success">Optional</p>
                        </div>

                        <div class="field">
                            <label class="label">Company</label>
                            <div class="control">
                                <div class="select my-select">
                                    <select name="company" v-model="company">
                                        <option v-for="company in companies" :key="company.id" :value="company.name">
                                            {{ company.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <p class="help is-success">Optional</p>
                        </div>

                        <div class="field">
                            <label class="label">Paybill</label>
                            <div class="control">
                                <div class="select my-select">
                                    <select name="paybill_no" required v-model="paybill_no">
                                        <option v-for="paybill in paybills" :key="paybill.id" :value="paybill.number">
                                            {{ paybill.number }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <p class="help is-warning">Required</p>
                        </div>
                    </div>

                    <div class="column is-three-fifths">
                        <label class="label">Transaction Date</label>
                        <div class="control">
                            <input class="input my-input" type="date" name="transaction_date"
                                   v-model="transaction_date">
                            <p class="help is-success">Default is today</p>
                        </div>

                        <div class="field mt-3">
                            <label class="label">Additional Info</label>
                            <div class="control">
                                <textarea class="textarea" placeholder="Anything You Think We Should Know?" rows="1"
                                          name="a_info" v-model="a_info"></textarea>
                            </div>
                            <p class="help is-success">Optional</p>
                        </div>

                        <div class="field">
                            <label class="label">Elevation</label>
                            <div class="control">
                                <label class="radio">
                                    <input type="radio" name="urgency" value="urgent" v-model="urgency">
                                    Urgent
                                </label>
                                <label class="radio">
                                    <input type="radio" name="urgency" value="emergency" v-model="urgency">
                                    Emergency
                                </label>
                            </div>
                            <p class="help is-success">Optional</p>
                        </div>

                        <div class="field is-grouped mt-6">
                            <div class="control">
                                <button class="button is-link" type="submit">Submit</button>
                            </div>
                            <div class="control">
                                <button class="button is-link is-light" type="reset">Cancel</button>
                            </div>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    </main>
</template>

<style scoped>
.my-select,
.my-select select {
    color: #363636;
    width: 100%;
}

.limited-form{
    max-width: 500px;
}
</style>

<script setup>
let paybills = null
let companies = null
const {data: paybills_data} = await useFetch('/api/paybills')
if (paybills_data.value) {
    paybills = paybills_data.value
} else {
    console.log(paybills_data)
}

const {data: companies_data} = await useFetch('/api/company')
if (companies_data.value) {
    companies = companies_data
} else {
    console.log(companies_data)
}

const safaricom_no = ref('')
const airtel_no = ref('')
const amount = ref('')
const name = ref('')
const issue = ref('')
const company = ref('')
const paybill_no = ref('')
const transaction_date = ref('')
const a_info = ref('')
const urgency = ref('')
const reference = ref('')
const user = useUser()

const createNewTicket = async () => {
    const ticket = {
        safaricom_no: safaricom_no.value,
        airtel_no: airtel_no.value,
        amount: amount.value,
        name: name.value,
        issue: issue.value,
        company: company.value,
        paybill_no: paybill_no.value,
        transaction_date: transaction_date.value,
        a_info: a_info.value,
        urgency: urgency.value,
        reference: reference.value,
        user_id: user.value.user_id
    }
    const {data: response} = await useFetch('/api/tickets/create', {
        method: 'POST',
        body: ticket
    })

    if (response.value.statusCode === 200) {
        console.log(response.value)
        safaricom_no.value = ''
        airtel_no.value = ''
        amount.value = ''
        name.value = ''
        issue.value = ''
        company.value = ''
        paybill_no.value = ''
        transaction_date.value = ''
        a_info.value = ''
        urgency.value = ''
        reference.value = ''

        alert('Ticket Created Successfully')

        await navigateTo('/tickets/view/user')
    } else {
        console.log(response.value)
        alert(response.value.message)
    }
}

onMounted(() => {
    transaction_date.value = new Date().toISOString().split('T')[0]
})

</script>