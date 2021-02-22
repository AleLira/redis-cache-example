// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function responseHandler(result, req, res, next) {
  const status = result.statusCode || 500;
  let resBody = result.body || null;

  if (status < 200 || status > 299) {
    let message = result.message;

    if (result.code === "ER_ACCESS_DENIED_ERROR") {
      message = `Oops! This server is not authorized to access the database. Contact our support!`;
    }

    if (result.sql) {
      message = `Ops! An internal error has occurred, please contact our support to check the logs`;
    }

    resBody = {
      message,
      stack: result.stack,
    };

    resBody = {
      message,
    };
  }

  res.status(status).send(resBody);
}
