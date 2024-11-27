import passport from "passport";
import { DynamicStrategy } from "@dynamic-labs/passport-dynamic";
import type { PassportUser } from 'fastify';


// TODO: fetch this from endpoint jwks
const publicKey =
  "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA2ZJol3tCFQnipFYfJxLMbmGzUKO/XQ4yHyXhA6ER/9rVY8jhROOQ+7OyJM3UjvGqTjDBc1T4kiiYXam6viVSCtdcwuuAWsbUAyggpsHj6fh+4PACh4g8MonJ1A+qwBiF1TLGbxS3w5KBB1mVmLw3tdEKz6dkqUBrpcP7AeEliPSIUIsliwxK/v1q1OIT66Q/EbnfWrp8oU7ydNcRJF47K1UbwzOBK3IU3cD9ZkIfQGJHKmezk4OPCmRgmX8wFM2mbIyh5bTYbHPMRAjWBEbLUqVcy1HCjcyZu1P0tRUu2CgH7HC7+DI4SQ0FmRcYDSmbsA4mdrjE900Kkd1S3FhjBZheotg1/QaISjD9JYEXUk/pmZfNcJkiy+GD/tS/GyHoflCH5w6OGfhUIst9I+rh7+J7L1olCFYPhXvUa3YoOo3c85NoS8oO1N6hNSBlMBY1K2+zcBmymkDwjklm4CTltIBGohMnwVmOTlELxPuGRM7Mqm/Na3A6+tFJOweiB2PhTO0NKI/2UEH2chk5ZPBn6zfy3NKuq67OSZcoV6mYMlqmGNWmjk19vtU6Jh3tybEqS6Gg6AaLVCgzyWsZwKaByAY+kV3vvBg01g9bpFNJTpql5brciRuP3k6FYY71oN+yfmBVK1i8ldgiWVf0mN5fF11l3qn9QEcf7z2FnyUwizECAwEAAQ==\n-----END PUBLIC KEY-----";

export const configurePassport = () => {
  passport.use(
    new DynamicStrategy(
      {
        publicKey,
      },
      (payload, done) => {
        try {
          const user: PassportUser = {
            userId: payload.sub,
            ...payload
          };
          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  return passport;
};