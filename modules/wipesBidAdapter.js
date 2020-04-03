import * as utils from '../src/utils.js';
import {config} from '../src/config.js';
import {registerBidder} from '../src/adapters/bidderFactory.js';
import {VIDEO} from '../src/mediaTypes.js';

const BIDDER_CODE = 'wipes';
const ALIAS_BIDDER_CODE = ['wi'];
const SUPPORTED_MEDIA_TYPES = [VIDEO]
const ENDPOINT_URL = 'https://adn-srv.reckoner-api.com/v1/prebid';

function isBidRequestValid(bid) {
  switch (true) {
    case !!(bid.params.asid):
      break;
    default:
      utils.logWarn(`isBidRequestValid Error. ${bid.params}, please check your implementation.`);
      return false;
  }
  return true;
}

function buildRequests(validBidRequests, bidderRequest) {
  return validBidRequests.map(bidRequest => {
    const params = bidRequest.params;
    const asid = params.asid;
    return {
      method: 'GET',
      url: ENDPOINT_URL,
      data: {
        asid: asid,
        mediaTypes: {
          video: {
            context: 'outstream'
          }
        },
      }
    }
  });
}

function interpretResponse(serverResponse, bidRequest) {
  const bidResponses = [];
  const response = serverResponse.body;
  const cpm = response.cpm * 1000 || 0;
  if (cpm !== 0) {
    const netRevenue = (response.netRevenue === undefined) ? true : response.netRevenue;
    const bidResponse = {
      requestId: response.uuid,
      cpm: cpm,
      width: response.width,
      height: response.height,
      creativeId: response.videoCreativeId || 0,
      dealId: response.dealId,
      currency: 'JPY',
      netRevenue: netRevenue,
      ttl: config.getConfig('_bidderTimeout'),
      referrer: bidRequest.data.r || '',
      mediaType: VIDEO,
      ad: response.adTag,
    };
    bidResponses.push(bidResponse);
  }
  return bidResponses;
}

export const spec = {
  code: BIDDER_CODE,
  aliases: ALIAS_BIDDER_CODE,
  isBidRequestValid,
  buildRequests,
  interpretResponse,
  supportedMediaTypes: SUPPORTED_MEDIA_TYPES
}
registerBidder(spec);
