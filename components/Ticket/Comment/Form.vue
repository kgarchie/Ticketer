<template>
    <form class="media box is-fullwidth"
          @submit.prevent="$emit('comment', {comment: comment, tagged: tagged}); comment=''; tagged=[]"
          @reset.prevent="$emit('cancel')" id="commentForm">
        <div class="media-content">
            <div class="field">
                <div class="control is-relative">
                    <!-- display taggable people -->
                    <div v-if="displayTaggablePeople" class="box taggable-people" id="popUpTagger">
                        <ul class="is-flex is-flex-direction-column-reverse">
                            <li v-for="(person, index) in taggablePeople" :key="index" @click="tagPerson(person.user_id)">
                                {{ person.name || person.user_id }}
                            </li>
                        </ul>
                    </div>
                    <textarea class="textarea" placeholder="Add a comment..." v-model="comment"
                              id="commentReplyTextArea"></textarea>
                </div>
            </div>
            <div class="field is-grouped">
                <div class="control">
                    <button class="button is-link" type="submit" id="submit-comment-button">Submit</button>
                </div>
                <div class="control">
                    <button class="button is-link is-light" type="reset">Cancel</button>
                </div>
            </div>
        </div>
    </form>
</template>

<script setup lang="ts">
const props = defineProps({
    taggable: {
        type: Object as PropType<any>,
        required: false,
        default: () => []
    }
})

const comment = ref('')

const tagged = reactive({
    value: [] as Array<any>
})

const ph = props.taggable as Array<any>
// filter out the people depending on the user input after the @

// map over and await the names in the ph array
let placeholder = await Promise.all(
    ph.map(async (person: any) => {
        return {
            name: await person.name,
            user_id: person.user_id
        }
    })
)

const taggablePeople = computed(() => {
    // console.log(placeholder)
    if (comment.value) {
        let lastAt = comment.value.lastIndexOf('@')
        let input = comment.value.substring(lastAt + 1)
        return placeholder.filter((person: any) => person.name.toLowerCase().includes(input.toLowerCase()))
    } else {
        return placeholder
    }
})

let displayTaggablePeople = false

const tagPerson = (user_id: any = null) => {
    if (user_id) {
        // there can be more than one person tagged and thus more than one @
        // so we need to replace the last @ with the person's name
        let lastAt = comment.value.lastIndexOf('@')
        let person = placeholder.find((person: any) => person.user_id === user_id)
        comment.value = comment.value.substring(0, lastAt) + '@' + person.name + ' '
        tagged.value.push(person)
        placeholder = placeholder.filter((person: any) => person.user_id !== user_id)

        if (process.client){
            const input = document.getElementById('commentReplyTextArea')
            input?.focus()
        }
    } else {
        // if no user_id is passed, then we just want to take the closest match
        // and replace the last @ with that person's name
        let lastAt = comment.value.lastIndexOf('@')
        // console.log(taggablePeople.value)
        let person = taggablePeople.value[0]
        comment.value = comment.value.substring(0, lastAt) + '@' + person.name + ' '
        tagged.value.push(person)
        // remove the person from the taggable people
        placeholder = placeholder.filter((p: any) => p.user_id !== person.user_id)
        // console.log(placeholder)
    }

    displayTaggablePeople = false
    // console.log(tagged.value)
    // console.log(placeholder)
}

onMounted(() => {
    const input = document.getElementById('commentReplyTextArea')
    input?.focus()

    // When user clicks tab, tag the person if the taggable people are displayed
    input?.addEventListener('keydown', (e: any) => {
        if (e.key === 'Tab') {
            if(comment.value === ''){
                e.preventDefault()
                comment.value = '@'
            } else {
                if(displayTaggablePeople) {
                    e.preventDefault()
                    tagPerson()
                }
            }
        }

        // if the letter entered is @, display the taggable people
        if (e.key === '@') {
            displayTaggablePeople = true
            // console.log(placeholder)
        }

        // if a person presses ctrl + enter, submit the comment
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault()
            document.getElementById('submit-comment-button')?.click()
        }

        // if a person starts deleting a tagged user, delete the whole word instead
        // remove the user from the tagged array and add them back to the taggable array
        // is user just began typing @ but hasn't tagged anyone yet and deleted the @, don't do anything
        if (e.key === 'Backspace' && comment.value.length > 0) {
            let lastAt = comment.value.lastIndexOf('@')
            let lastSpace = comment.value.lastIndexOf(' ')
            if (lastAt > lastSpace) {
                const poper = tagged.value.pop() || null
                if(poper){
                    placeholder.push(poper)
                }
                displayTaggablePeople = false
                comment.value = comment.value.substring(0, lastAt)
                // console.log(tagged.value)
                // console.log(placeholder)
            }
        }
    })
})
</script>

<style scoped>
.taggable-people {
    background-color: white;
    border-top: none;
    position: absolute;
    width: 100%;
    z-index: 10;
    overflow-y: auto;
    --height: clamp(10px, fit-content, 100%);
    height: var(--height);
    top: calc(-100px);
}

.taggable-people li {
    cursor: pointer;
    list-style: none;

    &:hover {
        background-color: #dcdcdc;
    }
}

</style>