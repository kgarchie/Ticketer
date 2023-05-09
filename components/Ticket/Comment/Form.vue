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
                                {{ person.name }}
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
const editedComment = ref<any>('')
const taggablePeople = ref<any>([])
taggablePeople.value = await props.taggable
// console.log(taggablePeople.value)

// const taggablePeople = computed(() => {
//     console.log(tp)
//     // take the comment value after the @ symbol, there can be multiple @ symbols, take the one after the last @ symbol
//     // editedComment.value = comment.value
//     let commentValue = editedComment.value.split('@').pop()
//     // // filter the taggable people by the comment value
//     return tp.filter((person: any) => person.name.toLowerCase().includes(commentValue.toLowerCase()))
//     // return props.taggable
// })

let displayTaggablePeople = false

// tag a person and add their name to the comment and tagged array
const tagPerson = (user_id: any = null) => {
    if (comment.value === '') {
        comment.value = '@'
        return
    }
    if (user_id) {
        let person: any = taggablePeople.value.find((person: any) => person.user_id === user_id)
        if(!tagged.value.includes(person)) {
            tagged.value.push(person)
        }
        // console.log(person)
        // replace the last @ symbol with the name of the person, there can be multiple @ symbols, take the one after the last @ symbol
        let commentValue = comment.value.split('@').pop()
        // console.log(commentValue)
        // replace the last @ symbol with the name of the person
        comment.value = comment.value.replace(`@${commentValue}`, `@${person.name} `)
        // console.log(comment.value)
        // hide the taggable people div
        displayTaggablePeople = false
    } else {
        // get the name of the person
        let person = taggablePeople.value[0]
        // replace the last @ symbol with the name of the person, there can be multiple @ symbols, take the one after the last @ symbol
        let commentValue = comment.value.split('@').pop()
        // console.log(commentValue)
        // replace the last @ symbol with the name of the person
        comment.value = comment.value.replace(`@${commentValue}`, `@${person.name} `)
        // add the user_id to the tagged array
        if (!tagged.value.includes(person)) {
            tagged.value.push(person)
        }
    }

    // remove the taggable person from the taggable people array
    taggablePeople.value = taggablePeople.value.filter((person: any) => person.user_id !== user_id)

    // console.log(taggablePeople.value)
    // console.log(tagged.value)
}

// console.log(taggablePeople.value)

function recalculateHeight() {
    // recalculate top depending on the number of people in the taggable people array
    let top = 0
    if (taggablePeople.value.length > 0) {
        // height is never more than 100px
        if (top > 100) {
            top = 100
        }

        // calculate the top of the taggable people div
        top = taggablePeople.value.length * 20 + 40
    } else {
        // hide the taggable people div
        displayTaggablePeople = false
    }

    // set the top of the taggable people div
    document.getElementById('popUpTagger')?.setAttribute('style', `top: -${top}px`)
}

// watch for changes in the comment and search taggable people
watch(comment, async value => {
    if (value.includes('@')) {
        displayTaggablePeople = true
        recalculateHeight()
        // take the comment value after the @ symbol, there can be multiple @ symbols, take the one after the last @ symbol and filter the taggable people, display the taggable people like search
        editedComment.value = comment.value
        let commentValue = editedComment.value.split('@').pop()
        // console.log(commentValue)
        // filter the taggable people by the comment value
        let teepee = await props.taggable
        taggablePeople.value = teepee.filter((person: any) => person.name.toLowerCase().includes(commentValue.toLowerCase()))
        // console.log(taggablePeople.value)
    } else {
        displayTaggablePeople = false
    }
})

onMounted(() => {
    const input = document.getElementById('commentReplyTextArea')
    input?.focus()

    // listen for tab key to tag a person
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && taggablePeople.value.length > 0) {
            e.preventDefault()
            tagPerson()
        } else if (e.key === 'Escape') {
            displayTaggablePeople = false
        } else if (e.key === 'Enter' && e.ctrlKey) {
            // submit the comment
            document.getElementById('submit-comment-button')?.click()
        }

        // if user presses backspace and starts to remove the word after the @ symbol, remove that person from the tagged array, even if they are not fully removed
        if (e.key === 'Backspace') {
            let commentValue = editedComment.value.split('@').pop()
            // get the last word after the @ symbol
            let lastWord = commentValue.split(' ').pop()

            // check if the last word is a name of a person
            let person = taggablePeople.value.find((person: any) => person.name.toLowerCase() === lastWord.toLowerCase())
            if (person) {
                // remove the person from the tagged array
                tagged.value = tagged.value.filter((taggedPerson: any) => taggedPerson.user_id !== person.user_id)
                // add the person back to the taggable people array
                taggablePeople.value.push(person)
                console.log(tagged.value)
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
    top: -100px;
    overflow-y: auto;
    max-height: 100px;
    ul{
        padding: 0;
        display: flex;
        height: 20px;
    }
}

.taggable-people li {
    cursor: pointer;
    list-style: none;

    &:hover {
        background-color: #dcdcdc;
    }
}

</style>