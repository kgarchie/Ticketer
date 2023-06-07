import * as Minio from "minio";

const bucketName = process.env.BUCKET_NAME
const accessKey = process.env.ACCESS_KEY
const secretKey = process.env.SECRET_KEY
const endPoint = process.env.MINIO_HOST

if (!bucketName || !accessKey || !secretKey || !endPoint) throw new Error("Minio env variables not found");

function MinioClient() {
    try {
        return new Minio.Client({
            accessKey: accessKey,
            secretKey: secretKey,
            endPoint: endPoint,
            pathStyle: true,
        });
    } catch (err) {
        console.log("Error: ", err);
    }
}

const minioClient = MinioClient();
if (!minioClient) throw new Error("Minio client not found");


minioClient.bucketExists(bucketName, function (err, exists) {
    if (err) return;

    if (!exists) {
        minioClient.makeBucket(bucketName, function (err:any) {
            if (err) throw err;
        });
    }
});

export { bucketName, accessKey, secretKey, endPoint, minioClient }