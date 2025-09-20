import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  healthCheck() : object {
    const response = {
      URL: `http://localhost`,
      PORT: 3000,
      statusCode: 200,
      message: 'OK'
    }
    return response;
  }
}
