import type { Attachment } from "@prisma/client"
import { joinURL } from "ufo"

export function isImage(name: string) {
    const ext = name.split(".").pop()
    if (!ext) return false
    const images = ['jpg', 'jpeg', 'git', 'png']
    return images.includes(ext)
}

export function isPdf(name: string) {
    return name.split(".").pop() === 'pdf'
}

export function isVideo(name: string) {
    const ext = name.split(".").pop()
    if (!ext) return false
    const videos = ['mp4', 'mpeg', 'avi', 'm4a', 'mov']
    return videos.includes(ext)
}

export function isAudio(name: string) {
    const ext = name.split(".").pop()
    if (!ext) return false
    const audios = ['mp3', 'ogg']
    return audios.includes(ext)
}

export function videoPreview(attachment: Attachment) {
    const element = document.createElement('video')
    element.src = attachmentUrl(attachment)
    element.controls = true
    element.autoplay = true
    return element
}

export function audioPreview(attachment: Attachment) {
    const element = document.createElement("audio")
    element.src = attachmentUrl(attachment)
    element.controls = true
    return element
}

export function imagePreview(attachment: Attachment) {
    const element = document.createElement('img')
    element.src = attachmentUrl(attachment)
    return element
}

export function pdfPreview(attachment: Attachment) {
    const element = document.createElement('embed')
    element.src = attachmentUrl(attachment)
    element.type = "pdf"
    return element
}

export function loadPreview(attachment: Attachment) {
    if (isAudio(attachment.name)) return audioPreview(attachment)
    if (isVideo(attachment.name)) return videoPreview(attachment)
    if (isImage(attachment.name)) return imagePreview(attachment)
    if (isPdf(attachment.name)) return pdfPreview(attachment)

    const _default = document.createElement("div")
    _default.innerText = attachment.name
    _default.classList.add("default")
    return _default
}

export function attachmentUrl(attachment: Attachment) {
    const url = attachment.url
    const fullUrl = joinURL(window.location.origin, "files", url)
    console.log(fullUrl)
    return fullUrl
}

export function downloadAttatchment(attachment: Attachment) {
    const url = attachmentUrl(attachment)
    const a = document.createElement('a')
    a.href = url
    a.download = attachment.name
    a.click()
}