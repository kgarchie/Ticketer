<template>
    <form class="media box is-fullwidth"
          @submit.prevent="$emit('comment', {comment: comment, tagged: tagged}); comment=''; tagged=[];"
          @reset.prevent="$emit('cancel')" id="commentForm" autocomplete="off">
        <div class="media-content">
            <div class="field">
                <div class="control is-relative">
                    <div v-if="displayTaggablePeople" class="box taggable-people" id="popUpTagger">
                        <ul class="is-flex is-flex-direction-column-reverse">
                            <li v-for="(person, index) in filteredTagged" :key="index" class="tag-list-item"
                                @click="tagPerson(person.user_id)">
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
import {TaggedPerson} from "~/types";

const props = defineProps({
    taggable: {
        type: Array as PropType<TaggedPerson[]>,
        required: false,
        default: () => []
    }
})

const comment = ref('')
const tagged = ref<TaggedPerson[]>([])
const displayTaggablePeople = ref(false)

const taggablePeople = computed(() => {
    let taggedPeople = tagged.value

    return props.taggable.filter((person: TaggedPerson) => {
        return !taggedPeople.some((taggedPerson: TaggedPerson) => {
            return taggedPerson.user_id === person.user_id
        })
    })
})

const filteredTagged = ref<TaggedPerson[]>(taggablePeople.value)

function tagPerson(user_id: string) {
    let person = props.taggable.find((person: TaggedPerson) => person.user_id === user_id)
    if (person) {
        tagged.value.push(person)
    }
    let lastAt = comment.value.lastIndexOf('@')
    let input = comment.value.substring(0, lastAt)

    comment.value = input + '@' + person?.name + ' '
    displayTaggablePeople.value = false
    resetTaggableFiltered()
}

function closestMatches(input: string) {
    let localPeople = taggablePeople.value
    // return localPeople.filter((person: TaggedPerson) => {
    //     return person.name?.toLowerCase().startsWith(input.toLowerCase()) || person.name?.toLowerCase().includes(input.toLowerCase())
    // })
    // priority to startsWith
    let startsWith = localPeople.filter((person: TaggedPerson) => {
        return person.name?.toLowerCase().startsWith(input.toLowerCase())
    })

    if (startsWith.length > 0) {
        return startsWith
    } else {
        return localPeople.filter((person: TaggedPerson) => {
            return person.name?.toLowerCase().includes(input.toLowerCase())
        })
    }
}

function resetTaggableFiltered() {
    filteredTagged.value = taggablePeople.value
}

watch(comment, (newComment) => {
    if (newComment === '') {
        displayTaggablePeople.value = false
        tagged.value = []
    }

    let lastAt = newComment.lastIndexOf('@')
    let lastSpace = newComment.lastIndexOf(' ')

    if (lastAt <= lastSpace) {
        displayTaggablePeople.value = false
        resetTaggableFiltered()
        // console.log(tagged.value)
        // console.log(taggablePeople.value)
    } else {
        displayTaggablePeople.value = true
        let input = newComment.substring(lastAt + 1)
        filteredTagged.value = closestMatches(input)
    }
})

onMounted(() => {
    const commentReplyTextArea = document.getElementById('commentReplyTextArea')
    commentReplyTextArea?.focus()

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Tab' && displayTaggablePeople.value) {
            e.preventDefault()
            // tagPerson(filteredTagged.value[0].user_id)
            // console.log(filteredTagged.value[0].user_id)
            let startsWith = closestMatches(comment.value.substring(comment.value.lastIndexOf('@') + 1))
            if (startsWith.length > 0) {
                tagPerson(startsWith[0].user_id)
            }
            // console.log(tagged.value)
            commentReplyTextArea?.focus()
        } else if (e.key === 'Tab' && !displayTaggablePeople.value) {
            e.preventDefault()
            commentReplyTextArea?.focus()
            comment.value = '@'
        }
    })

    commentReplyTextArea?.addEventListener('keyup', (e) => {
        if (e.key === 'Backspace') {
            if (comment.value === '@' || comment.value === '') {
                displayTaggablePeople.value = false
                // resetTaggableFiltered()
            } else if (comment.value.length > 0) {
                let lastAt = comment.value.lastIndexOf('@')
                let lastSpace = comment.value.lastIndexOf(' ')

                if (lastAt > lastSpace) {
                    let popped = tagged.value.pop() || null
                    if (popped) {
                        comment.value = comment.value.slice(0, comment.value.length - popped.name!.length - 1)
                        displayTaggablePeople.value = false
                    }
                    // resetTaggableFiltered()
                    // console.log(tagged.value)
                }
            }
        }

        if (e.key === 'Escape') {
            displayTaggablePeople.value = false
            // resetTaggableFiltered()
        }

        if (e.key === 'Enter' && e.ctrlKey) {
            document.getElementById('submit-comment-button')?.click()
        }

        if(e.key === '@') {
            displayTaggablePeople.value = true
        }

        // highlight the closest match
        let startsWith = filteredTagged.value[0].name?.toLowerCase()
        if (!startsWith) return

        let nameList = document.getElementsByClassName('tag-list-item')
        if (!nameList) return

        let length = nameList.length
        for (let i = 0; i < length; i++) {
            let name = nameList[i].innerHTML.toLowerCase()
            if (name.trim().startsWith(startsWith.trim())) {
                console.log(nameList[i])
                nameList[i].classList.add('highlight')
            } else {
                nameList[i].classList.remove('highlight')
            }
        }
    })
})

onUnmounted(() => {
    const commentReplyTextArea = document.getElementById('commentReplyTextArea')
    commentReplyTextArea?.removeEventListener('keyup', () => {
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
        background-color: #111111;
        color: white;
    }

    &.highlight {
        background-color: #dcdcdc;
    }
}

.tag-list-item {
    padding: 0.25rem;
}
</style>