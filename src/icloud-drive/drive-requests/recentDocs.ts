import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import * as AR from "../../icloud-core/icloud-request";
import { logAPI } from "../../icloud-core/icloud-request/log";
import { TypesIo } from "../drive-types";

const recentDocsResponse = t.type({
  continuationMarker: t.string,
  documents: t.array(TypesIo.recentDoc),
  status: t.literal("CONSISTENT"),
});

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RecentDocsResponse extends t.TypeOf<typeof recentDocsResponse> {
}

// https://p46-docws.icloud.com/ws/_all_/list/enumerate/recentDocs?limit=50&unified_format=true&clientBuildNumber=2420Hotfix12&clientMasteringNumber=2420Hotfix12&clientId=4038aeb5-a95b-4bb0-b034-05ff67c58ba2&dsid=20322967922

export const recentDocs = <S extends AR.AuthenticatedState>(
  { limit }: { limit: number },
) => {
  return pipe(
    AR.buildRequest<S>(({ state: { accountData } }) => ({
      method: "GET",
      url:
        `${accountData.webservices.docws.url}/ws/_all_/list/enumerate/recentDocs?unified_format=true&limit=${limit}&dsid=${accountData.dsInfo.dsid}`,
      options: { addClientInfo: true },
    })),
    AR.handleResponse(AR.basicJsonResponse(recentDocsResponse.decode)),
    logAPI("recentDocs"),
  );
};
