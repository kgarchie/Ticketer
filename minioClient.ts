import Minio from "minio";

const bucketName = process.env.BUCKET_NAME
const accessKey = process.env.ACCESS_KEY
const secretKey = process.env.SECRET_KEY
const endPoint = process.env.HOST

if(!bucketName || !accessKey || !secretKey || !endPoint) throw new Error("Minio env variables not found");

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
if(!minioClient) throw new Error("Minio client not found");

const bucketExists = await new Promise((resolve, reject) => {
    minioClient.bucketExists(bucketName, function (err, exists) {
        if (err) return reject(err);
        resolve(exists);
    });
});

if (!bucketExists) {
    await new Promise((resolve, reject) => {
        minioClient.makeBucket(bucketName, function (err:any) {
            if (err) return reject(err);
            resolve(null);
        });
    }).then(
        () => console.log("Bucket created successfully in " + process.env.HOST),
    ).catch(
        (err) => {throw new Error(err)}
    )
}

export {bucketName, accessKey, secretKey, endPoint, minioClient}