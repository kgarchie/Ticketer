import {UserAuth} from "~/types";

export default defineNuxtPlugin(() => {
    const callState = useCall()

    class ECall {
        private peerConnection: RTCPeerConnection;
        private user: UserAuth;
        private localStream = new MediaStream();
        private remoteStream = new MediaStream();

        constructor(user: UserAuth) {
            this.peerConnection = new RTCPeerConnection()
            this.user = user
        }

        public placeAudioCall(user_id: string, chat_id: string | null) {
            document.getElementById('call-icon')?.classList.add('on-call')
            callState.value = 1

            if (!chat_id) {
                alert("Chat id is null | Error")
                return
            }

            navigator.mediaDevices.getUserMedia({audio: true})
                .then((stream) => {
                    this.localStream = stream
                    this.localStream.getTracks().forEach((track) => {
                        this.peerConnection.addTrack(track, stream);
                    });
                })
                .catch((error) => {
                    console.warn(error.message);
                });

            this.peerConnection.createOffer()
                .then((offer) => {
                    return this.peerConnection.setLocalDescription(offer);
                })
                .then(async () => {
                    $fetch('/api/chats/call',
                        {
                            method: 'POST',
                            body: {
                                user_id: this.user.user_id,
                                to_user_id: user_id,
                                chat_id: chat_id,
                                sdp: this.peerConnection.localDescription
                            }
                        }
                    ).then(
                        (response) => {
                            if (response.statusCode === 200) {
                                console.log("Offer sent")
                            } else if (response.statusCode === 204) {
                                alert("User is offline")
                                callState.value = null
                                return
                            } else {
                                alert(response.body)
                                callState.value = null
                                return
                            }
                        }
                    )
                })
                .catch((error) => {
                    console.warn(error.message);
                });

            this.peerConnection.onicecandidate = async (event) => {
                if (event.candidate) {
                    console.log("Ice candidate")
                }
            }
        }

        public acceptSdp(sdp: RTCSessionDescription | null) {
            if (!sdp) {
                alert("SDP is null | Error")
                return
            }

            this.peerConnection.setRemoteDescription(sdp).then(
                () => {
                    console.log("Call placed")
                })

            this.peerConnection.ontrack = (event) => {
                console.log("playing")
                event.streams.forEach(
                    (stream) => {
                        stream.getTracks().forEach((track) => {
                            this.localStream.addTrack(track);
                        });
                    })
            }
        }

        public acceptAudioCall(sdp: RTCSessionDescription | null, caller_user_id: string | null, chat_id: string | null) {
            if (!sdp) {
                alert("SDP is null | Error")
                return
            }

            navigator.mediaDevices.getUserMedia({audio: true})
                .then((stream) => {
                    this.remoteStream = stream
                    this.remoteStream.getTracks().forEach((track) => {
                        this.peerConnection.addTrack(track, stream);
                    });
                })
                .catch((error) => {
                    console.warn(error.message);
                });

            this.peerConnection.setRemoteDescription(sdp)
                .then(() => {
                    return this.peerConnection.createAnswer();
                })
                .then((answer) => {
                    return this.peerConnection.setLocalDescription(answer);
                })
                .then(async () => {
                    const response = await $fetch('/api/chats/call/accept',
                        {
                            method: 'POST',
                            body: {
                                callee_user_id: this.user.user_id,
                                caller_user_id: caller_user_id,
                                chat_id: chat_id,
                                sdp: this.peerConnection.localDescription
                            }
                        }
                    )

                    if (response.statusCode === 200) {
                        console.log("Call accept sent")
                    } else if (response.statusCode === 204) {
                        alert("User is offline")
                    } else {
                        alert(response.body)
                    }
                })
                .catch((error) => {
                    console.warn(error.message);
                });

            this.peerConnection.ontrack = (event) => {
                console.log("playing")
                event.streams.forEach(
                    (stream) => {
                        stream.getTracks().forEach((track) => {
                            this.localStream.addTrack(track);
                        });
                    })
            }
        }

        public rejectAudioCall(user_id: string) {
            this.peerConnection.close()
            this.peerConnection = new RTCPeerConnection()


            this.localStream.getTracks().forEach((track) => {
                track.stop();
            });
            this.localStream = new MediaStream();

            $fetch('/api/chats/call/reject',
                {
                    method: 'POST',
                    body: {
                        caller: user_id,
                        callee: this.user.user_id
                    }
                }).then(
                (response) => {
                    if (response.statusCode === 200) {
                        alert("Call rejected")
                        callState.value = null
                    } else if (response.statusCode === 204) {
                        alert("User is offline")
                    } else {
                        alert(response.body)
                    }
                }
            )
        }

        public endCall(user_id: string) {
            document.getElementById('call-icon')?.classList.remove('on-call')
            this.peerConnection.close()
            this.peerConnection = new RTCPeerConnection()

            this.localStream.getTracks().forEach((track) => {
                track.stop();
            })
            this.localStream = new MediaStream();

            this.remoteStream.getTracks().forEach((track) => {
                track.stop();
            })
            this.remoteStream = new MediaStream();

            $fetch('/api/chats/call/end',
                {
                    method: 'POST',
                    body: {
                        user: user_id,
                    }
                }).then(
                (response) => {
                    if (response?.statusCode === 200) {
                        alert("Call ended")
                        callState.value = null
                    } else {
                        alert(response.body)
                    }
                })
        }
    }
})