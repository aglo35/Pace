import {Events} from "ionic-angular";
import {Http} from "@angular/http";
import {Storage} from '@ionic/storage';
import {Injectable} from "@angular/core";

declare const facebookConnectPlugin: any;

@Injectable()
export class UserData {

    BASE_URL = 'localhost:8181';

    // TTU
    // BASE_URL = '10.224.4.183';

    // Viinamae
    // BASE_URL = '192.168.0.101';

    constructor(private events: Events,
                private http: Http,
                private storage: Storage) {
    }

    _favorites: Array<any> = [];
    HAS_LOGGED_IN = 'hasLoggedIn';
    PACE_USER = 'paceUser';

    url: any;
    paceUser: any;

    userId: any;
    userToken: any;

    shortTeamView: any;
    teamData: any;

    teams: any;

    groupData: any;

    getPaceUser(userID: any, accessToken: any) {
        console.log("UserID to make request with:", userID);
        return new Promise(resolve => {
            let url = this.constructGetPaceUserUrl(userID, accessToken);
            this.makeGetHttpReq(url).then(result => {
                let paceUser = this.extractPaceUser(this.formatToJSON(result));
                resolve(paceUser)
            });
        });
    }

    private formatToJSON(result) {
        return result.json();
    }

    getUserShortTeamView() {
        return new Promise(resolve => {
            this.storage.get(this.PACE_USER).then(paceUser => {
                let url = this.constructGetUserShortTeamViewUrl(paceUser);
                this.makeGetHttpReq(url).then(result => {
                    let userTeamView = this.extractUserShortTeamView(this.formatToJSON(result));
                    resolve(userTeamView)
                })
            });
        });
    }

    getTeamData(teamId: any) {
        return new Promise(resolve => {
            // TODO: Uncomment for backend request
            // let url = this.constructGetTeamDataUrl(teamId);
            // let teamData = this.extractTeamData(this.makeGetHttpReq(url));
            let teamData = this.extractTeamData(this.mockTeamData());
            resolve(teamData);
        });
    }

    saveNewPaceUser(userProfile: any, status: any, accessToken: any) {
        return new Promise((resolve, reject) => {
            // this.url = 'http://' + this.BASE_URL + ':8080/api/user';

            this.paceUser = JSON.stringify({
                facebookId: userProfile.id,
                name: userProfile.name,
                authResponse: status,
                accessToken: accessToken,
                picture: "http://graph.facebook.com/" + userProfile.id + "/picture?type=large"
            });

            // this.http.post(this.url, this.paceUser).subscribe(paceUser => {
            //     this.extractPaceUser(paceUser);
            //     resolve(paceUser)
            // }, error => {
            //     console.log("Error... is backend running? probably need to enable cors mapping?");
            //     console.log(JSON.stringify(error.json()));
            //     reject();
            // }, () => console.log('User data fetching complete!'));

            let paceUser = this.extractPaceUser(this.mockGetPaceUser());
            resolve(paceUser);
        });
    }

    private extractUserShortTeamView(teamView: any) {
        this.shortTeamView = teamView;

        return teamView;
    }

    private extractTeamData(teamData: any) {
        // TODO: maybe add teamData.json() for backend
        this.teamData = teamData;

        return teamData;
    }

    private extractPaceUser(paceUser: any) {
        console.log("User data from BackPace...", paceUser);
        this.paceUser = paceUser;
        this.userId = paceUser.facebookId;
        this.userToken = paceUser.accessToken;

        this.storage.set(this.PACE_USER, paceUser);
        return paceUser;
    }

    private constructGetPaceUserUrl(userID: any, accessToken: any) {
        let url = 'http://' + this.BASE_URL + '/api/user?facebookId=' + userID + '&token=' + accessToken;
        console.log("Making request to: " + url);
        return url;
    }

    private constructGetUserShortTeamViewUrl(paceUser: any) {
        let url = 'http://' + this.BASE_URL + '/api/dashboard?facebookId='
            + paceUser.facebookId + '&teamView=short&token=' + paceUser.accessToken;
        console.log("Making request to: " + url);
        return url;
    }

    //
    // private constructGetTeamDataUrl(teamId: any) {
    //     return 'http://' + this.BASE_URL + ':8080/api/team?facebookId=' + this.userId + '&token=' + this.userToken + '&teamId=' + teamId;
    // }
    //
    private makeGetHttpReq(url: any) {
        return new Promise(resolve => {
            this.http.get(url).subscribe(result => {
                resolve(result);
            }, error => {
                this.handleGetHttpReqError(error);
            }, () => this.handleGetHttpReqFinally());
        });
    }

    private handleGetHttpReqFinally() {
        console.log('User data fetching complete!');
    }

    private handleGetHttpReqError(error: any) {
        console.log("Error occurred while fetching user data... probably need to enable correct cors mapping");
        console.log(JSON.stringify(error.json()));
    }

    getPaceUserData() {
        return this.paceUser;
    }

    getPaceUserPicture() {
        return new Promise((resolve, reject) => {
            this.url = this.paceUser.picture + '&redirect=false';
            console.log("Making request to", this.url);
            this.http.get(this.url).subscribe(success => {
                console.log("Success!");
                resolve(success);
            }, error => {
                console.log("Error!");
                reject(error);
            });
        });
    }

    getGroups() {
        return new Promise((resolve, reject) => {
            this.url = 'http://' + this.BASE_URL + ':8080/api/dashboard/join_group'
                + '?facebookId=' + this.userId
                + '&token=' + this.userToken
                + '&groups=all';
            console.log("Making request to: " + this.url);
            this.http.get(this.url).subscribe(teams => {
                this.teams = teams.json();
                resolve(this.teams);
            }, error => {
                console.log("Error occurred in getGroups()");
                reject(error);
            });
        });
    }

    joinTeam(teamId: any) {
        return new Promise((resolve, reject) => {
            this.url = 'http://' + this.BASE_URL + ':8080/api/dashboard/join_group?facebookId=' + this.userId + '&token=' +
                this.userToken;
            console.log("Making request to: " + this.url);

            this.groupData = JSON.stringify({
                teamId: teamId
            });

            this.http.post(this.url, this.groupData).subscribe(success => {
                console.log("Joined team...");
                resolve(success);
            }, () => {
                console.log("Error... is backend running? probably need to enable cors mapping?");
                reject();
            }, () => console.log('Joining team complete!'));
        });
    }

    markAttendance(teamId: any, attendance: any, date: any) {
        return new Promise((resolve, reject) => {
            this.url = 'http://' + this.BASE_URL + ':8080/api/team?facebookId=' + this.userId + '&token=' +
                this.userToken + '&teamId=' + teamId + '&attendance=' + attendance + '&date=' + date;
            console.log("Making request to: " + this.url);

            this.groupData = JSON.stringify({});

            this.http.post(this.url, this.groupData).subscribe(success => {
                console.log("Attendance marked...");
                resolve(success);
            }, () => {
                console.log("Error... is backend running? probably need to enable cors mapping?");
                reject();
            }, () => console.log('Marking attendance complete!'));
        });
    }

    getAllAchievements() {
        return new Promise((resolve, reject) => {
            this.url = 'http://' + this.BASE_URL + ':8080/api/profile/goal'
                + '?facebookId=' + this.userId
                + '&token=' + this.userToken;
            console.log("Making request to: " + this.url);
            this.http.get(this.url).subscribe(goals => {
                resolve(goals.json());
            }, error => {
                console.log("Error occurred in getAllAchievements()");
                reject(error);
            });
        });
    }

    uploadAchievement(fileName: any, image: any) {
        return new Promise((resolve, reject) => {
            this.url = 'http://' + this.BASE_URL + ':8080/api/fileUpload' +
                '?name=' + fileName +
                '&file=' + image;


            console.log("Making request to: " + this.url);

            let params = JSON.stringify({
                headers: {'Content-Type': undefined}
            });

            this.http.post(this.url, params).subscribe(success => {
                console.log("File upload request complete...");
                resolve(success);
            }, () => {
                console.log("Error... is backend running? probably need to enable cors mapping?");
                reject();
            }, () => console.log('File upload complete!'));
        });
    }

    removeFavorite(sessionName: any) {
        let index = this._favorites.indexOf(sessionName);
        if (index > -1) {
            this._favorites.splice(index, 1);
        }
    }

    saveLoginStorage(hasLoggedIn: boolean) {
        this.storage.set(this.HAS_LOGGED_IN, hasLoggedIn);
    }

    FbLogout() {
        return new Promise((resolve, reject) => {
            this.storage.set(this.HAS_LOGGED_IN, false);
            console.log("UserData: logout() reached...");

            facebookConnectPlugin.logout(() => {
                console.log("Logging out...");

                this.events.publish('user:logout');

                resolve();
            }, (err: any) => {
                console.log("Unsuccessful logout from Facebook!");
                console.error(JSON.stringify(err.json()));

                reject();
            });
        });
    }

    hasLoggedIn(): Promise<boolean> {
        return this.storage.get(this.HAS_LOGGED_IN).then((value) => {
            return value === true;
        });
    };

    private mockUserShortTeamView() {
        let teamKoss = {
            id: 1,
            teamName: "Kossurühm",
            shortTableRowList: [
                {
                    rank: 1,
                    userName: "Marin",
                    tier: "...",
                    points: 1270
                },
                {
                    rank: 2,
                    userName: "Marianne",
                    tier: "...",
                    points: 1250
                }
            ]
        };

        let teamSalto = {
            id: 2,
            teamName: "Saltopoisid",
            shortTableRowList: [
                {
                    rank: 1,
                    userName: "Allar",
                    tier: "...",
                    points: 1000
                },
                {
                    rank: 2,
                    userName: "Paul",
                    tier: "...",
                    points: 980
                }
            ]
        };
        let mockUserShortTeamView = [];
        mockUserShortTeamView.push(teamKoss, teamSalto);
        return mockUserShortTeamView;
    }

    private mockGetPaceUser() {
        return {
            facebookId: "",
            accessToken: ""
        };
    }

    private mockTeamData() {
        return {
            fullScoresTableList: [
                {
                    rank: 1,
                    userName: "Allar",
                    tier: "...",
                    points: 1000
                },
                {
                    rank: 2,
                    userName: "Paul",
                    tier: "...",
                    points: 980
                },
                {
                    rank: 3,
                    userName: "Hannes",
                    tier: "...",
                    points: 930
                },
                {
                    rank: 4,
                    userName: "Stefan",
                    tier: "...",
                    points: 900
                },
                {
                    rank: 5,
                    userName: "Georg",
                    tier: "...",
                    points: 200
                }
            ],
            currentMonthAttendance: [
                {
                    date: '13-04-2017',
                    maleAttendees: 6,
                    femaleAttendees: 10
                },
                {
                    date: '14-04-2017',
                    maleAttendees: 8,
                    femaleAttendees: 4
                }
            ]

        };
    }
}
