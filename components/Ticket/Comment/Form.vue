<template>
    <form class="media box is-fullwidth" @submit.prevent="$emit('comment', comment); comment=''" @reset.prevent="$emit('cancel')" id="commentForm">
        <div class="media-content">
            <div class="field">
                <p class="control">
                    <textarea class="textarea" placeholder="Add a comment..." v-model="comment"></textarea>
                </p>
            </div>
            <div class="field is-grouped">
                <div class="control">
                    <button class="button is-link" type="submit">Submit</button>
                </div>
                <div class="control">
                    <button class="button is-link is-light" type="reset">Cancel</button>
                </div>
            </div>
        </div>
    </form>
</template>
<script setup lang="ts">
const comment = ref('')


// when user presses, ctrl + enter, submit the comment
onMounted(() => {
    const commentForm = document.getElementById('commentForm')
    if(commentForm){
        commentForm.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                commentForm.dispatchEvent(new Event('submit'))
            }
        })
    }
})
</script>