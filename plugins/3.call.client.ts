import type {sdpCall, UserAuth} from "~/types";

export default defineNuxtPlugin(() => {
    const eCall = useCall()

    class ECall {
        private peerConnection: RTCPeerConnection;
        private user: UserAuth;
        public onCall: boolean = false;
        private localStream = new MediaStream();
        private remoteStream = new MediaStream();

        constructor(user: UserAuth) {
            this.peerConnection = new RTCPeerConnection()
            this.user = user
        }

        private createdOffer(description: RTCSessionDescription) {
            this.peerConnection.setLocalDescription(description)
                .then(() => {
                    console.log("Offer created")
                })
                .catch((error) => {
                    console.warn(error.message);
                });
        }

        public placeAudioCall(user_id: string, chat_id: string | null) {
            document?.getElementById('call-icon')?.classList.add('on-call')

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
                                return;
                            } else if (response.statusCode === 204) {
                                alert("User is offline")
                            } else {
                                alert(response.body)
                            }

                            this.onCall = false
                            return
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

        public acceptSdp(sdp: RTCSessionDescription) {
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

        private getMediaStream(constraints:MediaStreamConstraints) {
            navigator.mediaDevices.getUserMedia(constraints)
                .then((stream) => {
                    this.remoteStream = stream
                    this.remoteStream.getTracks().forEach((track) => {
                        this.peerConnection.addTrack(track, stream);
                    });
                })
                .catch((error) => {
                    console.warn(error.message);
                });
        }

        public setUpAcceptedCall(call:sdpCall, constraints: MediaStreamConstraints) {
            this.getMediaStream(constraints)

            this.peerConnection.setRemoteDescription(call.sdp)
                .then(() => {
                    return this.peerConnection.createAnswer();
                })
                .then((answer) => {
                    return this.peerConnection.setLocalDescription(answer);
                })
                .then(async () => {
                    // TODO: send to server via socket, throw error if no socket
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
            this.endCall()

            // TODO: send to server
        }

        private endCall() {
            document?.getElementById('call-icon')?.classList.remove('on-call')
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
        }
    }
})