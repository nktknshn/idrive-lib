import { pipe } from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/TaskEither";
import { DepAuthenticateSession, DepFs } from "../../deps-types";
import * as Auth from "../../icloud-authentication";
import { authenticateState } from "../../icloud-authentication/methods";
import { validateResponseJson } from "../../icloud-authentication/requests/validate";
import { AuthenticatedState, BaseState } from "../../icloud-core/icloud-request";
import { debugTimeRTE } from "../../logging/debug-time";
import { loggerIO } from "../../logging/loggerIO";
import { BufferDecodingError, FileReadingError, JsonParsingError, TypeDecodingError } from "../../util/errors";
import { appendFilename } from "../../util/filename";
import { tryReadJsonFile } from "../../util/files";

export type Deps =
  & DepAuthenticateSession
  & { sessionFile: string }
  & DepFs<"readFile">;

export function saveAccountData(
  accountData: Auth.AccountData,
  accountDataFilePath: string,
): RTE.ReaderTaskEither<DepFs<"writeFile">, Error, void> {
  return ({ fs: { writeFile } }) => writeFile(accountDataFilePath, JSON.stringify(accountData));
}

export function readAccountDataFromFile(
  accountDataFilePath: string,
): RTE.ReaderTaskEither<
  DepFs<"readFile">,
  FileReadingError | JsonParsingError | BufferDecodingError | TypeDecodingError,
  Auth.AccountData
> {
  return pipe(
    tryReadJsonFile(accountDataFilePath),
    RTE.chainTaskEitherKW((json) => {
      if (validateResponseJson(json)) {
        return TE.right(json);
      }
      return TE.left(
        TypeDecodingError.create([], "wrong AccountLoginResponseBody"),
      );
    }),
  );
}

export const accountDataFilename = (sessionFile: string): string => appendFilename(sessionFile, ".accountdata");

export const loadAccountDataFromFile = (
  { session }: BaseState,
): RTE.ReaderTaskEither<
  DepAuthenticateSession & { sessionFile: string } & DepFs<"readFile">,
  Error,
  AuthenticatedState
> =>
  pipe(
    RTE.asksReaderTaskEitherW(
      (deps: { sessionFile: string }) =>
        pipe(
          RTE.of(accountDataFilename(deps.sessionFile)),
          RTE.chainFirstIOK((fpath) => loggerIO.debug(`loadAccountDataFromFile(${fpath})`)),
          RTE.chain(readAccountDataFromFile),
        ),
    ),
    RTE.map(accountData => ({ session, accountData })),
    RTE.orElseW(e =>
      pipe(
        loggerIO.error(`couldn't read account data from file. (${e}). Fetching from the icloud server`),
        RTE.fromIO,
        RTE.chain(() => authenticateState({ session })),
      )
    ),
  );

export const saveAccountDataToFile = <S extends { accountData: Auth.AccountData }>(
  state: S,
): RTE.ReaderTaskEither<{ sessionFile: string } & DepFs<"writeFile">, Error, void> =>
  pipe(
    RTE.asksReaderTaskEitherW((deps: { sessionFile: string }) =>
      saveAccountData(state.accountData, accountDataFilename(deps.sessionFile))
    ),
    debugTimeRTE("saveAccountData"),
  );
