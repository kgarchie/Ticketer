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

const tpStore = ref<any>([])
tpStore.value = await props.taggable

const taggablePeople = computed(() => {
    let tp = tpStore.value.filter((person: any) => !tagged.value.includes(person))
    console.log(tp)
    return tp
})

let displayTaggablePeople = false

const tagPerson = (user_id: any = null) => {
    if (comment.value === '') {
        comment.value = '@'
        return
    }

    if (user_id) {
        let person: any = tpStore.value.find((person: any) => person.user_id === user_id)
        if(person && !tagged.value.includes(person)) tagged.value.push(person)

        let commentValue = comment.value.split('@').pop()
        comment.value = comment.value.replace(`@${commentValue}`, `@${person.name} `)

    } else {
        let person = tpStore.value.at(0)

        let commentValue = comment.value.split('@').pop()
        comment.value = comment.value.replace(`@${commentValue}`, `@${person.name} `)

        if (person && !tagged.value.includes(person)) tagged.value.push(person)
    }

    displayTaggablePeople = false
}

watch(comment, value => {
    displayTaggablePeople = !!value.includes('@');
})

onMounted(() => {
    const input = document.getElementById('commentReplyTextArea')
    input?.focus()
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