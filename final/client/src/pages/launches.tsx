import React, { Fragment } from "react";
import { useQuery, ApolloConsumer } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { LaunchTile, Header, Button, Loading } from "../components";
import { RouteComponentProps } from "@reach/router";
import * as GetLaunchListTypes from "./__generated__/GetLaunchList";
import ApolloClient from "apollo-client";
import { math } from "polished";

export const LAUNCH_TILE_DATA = gql`
  fragment LaunchTile on Launch {
    __typename
    id
    isBooked
    rocket {
      id
      name
    }
    mission {
      name
      missionPatch
    }
  }
`;

export const GET_LAUNCHES = gql`
  query GetLaunchList($after: String) {
    launches(after: $after) {
      cursor
      hasMore
      launches {
        ...LaunchTile
      }
    }
  }
  ${LAUNCH_TILE_DATA}
`;

interface LaunchesProps extends RouteComponentProps {}

let fakeId = 100;

function addLaunch(apolloClient: ApolloClient<object>) {
  const cachedData = apolloClient.readQuery({ query: GET_LAUNCHES });

  const newLaunch = {
    id: fakeId++,
    isBooked: false,
    mission: {
      missionPatch: "https://images2.imgbox.com/d2/3b/bQaWiil0_o.png",
      name: "ZeneLaunch!",
      __typename: "Mission",
    },
    rocket: {
      id: "ZeneRocket",
      name: "ZeneRocket",
      __typename: "Rocket",
    },
    __typename: "Launch",
  };

  apolloClient.writeQuery<GetLaunchListTypes.GetLaunchList>({
    query: GET_LAUNCHES,
    data: {launches: {__typename: "LaunchConnection", hasMore: cachedData.launches.hasMore, cursor: cachedData.launches.cursor, launches: [newLaunch, ...cachedData.launches.launches]}},
  });
}

const Launches: React.FC<LaunchesProps> = () => {
  const { data, loading, error, fetchMore } = useQuery<
    GetLaunchListTypes.GetLaunchList,
    GetLaunchListTypes.GetLaunchListVariables
  >(GET_LAUNCHES);

  if (loading) return <Loading />;
  if (error || !data) return <p>ERROR</p>;

  return (
    <ApolloConsumer>
      {(client) => (
        <Fragment>
          <button onClick={() => addLaunch(client)}>Add launch!!!!</button>
          <Header />
          {data.launches &&
            data.launches.launches &&
            data.launches.launches.map((launch: any) => (
              <LaunchTile key={launch.id} launch={launch} />
            ))}
          {data.launches && data.launches.hasMore && (
            <Button
              onClick={() =>
                fetchMore({
                  variables: {
                    after: data.launches.cursor,
                  },
                  updateQuery: (prev, { fetchMoreResult, ...rest }) => {
                    if (!fetchMoreResult) return prev;
                    return {
                      ...fetchMoreResult,
                      launches: {
                        ...fetchMoreResult.launches,
                        launches: [
                          ...prev.launches.launches,
                          ...fetchMoreResult.launches.launches,
                        ],
                      },
                    };
                  },
                })
              }
            >
              Load More
            </Button>
          )}
        </Fragment>
      )}
    </ApolloConsumer>
  );
};

export default Launches;
